import { protocol } from 'electron'
import { createReadStream, statSync, existsSync } from 'fs'
import { extname, normalize, isAbsolute } from 'path'
import log from 'electron-log/main'

/**
 * 本地媒体文件协议模块
 *
 * 提供 `fc://` 自定义协议，让渲染进程安全访问本地视频文件。
 *
 * 背景：Electron 渲染进程受 CSP 限制，无法直接通过 `file://` 加载本地媒体。
 * 本模块通过注册特权协议 + 协议处理器，将本地文件路径映射为渲染进程可访问的 URL。
 *
 * 使用方式：
 *   渲染进程: <video src="fc://media/C%3A%2FUsers%2F...%2Fvideo.mp4">
 *   主进程: 拦截请求 → 解析文件路径 → 返回视频流（支持 Range 断点续传）
 *
 * 生命周期：
 *   1. app.ready 之前调用 registerPrivilegedSchemes() 注册特权协议
 *   2. app.ready 之后调用 registerFileProtocolHandler() 注册请求处理器
 */

/** 支持的媒体文件 MIME 类型映射 */
const MEDIA_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.m4v': 'video/mp4',
}

/**
 * 注册 fc 协议为特权协议
 *
 * 必须在 app.ready 之前调用，否则自定义协议无法被 Chromium 识别为安全协议，
 * 会导致 CSP 拦截、CORS 拒绝、fetch API 不可用等问题。
 *
 * privileges 说明：
 *   - secure:     标记为安全协议（HTTPS 同级权限）
 *   - standard:   支持标准 URL 解析（host/path/search/hash）
 *   - supportFetchAPI: 允许通过 fetch 访问
 *   - bypassCSP:  允许绕过 Content-Security-Policy 限制
 *   - corsEnabled: 允许跨域请求
 */
export function registerPrivilegedSchemes(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'fc',
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true,
        bypassCSP: true,
        corsEnabled: true,
      },
    },
  ])
}

/**
 * 注册 fc:// 协议的请求处理器
 *
 * 处理所有来自渲染进程的 fc:// 请求，将本地文件以流式响应返回。
 * 支持 HTTP Range 请求（206 Partial Content），视频播放器可正常 seek。
 *
 * 必须在 app.ready 之后、任何窗口加载 URL 之前调用。
 */
export function registerFileProtocolHandler(): void {
  protocol.handle('fc', (request) => handleProtocolRequest(request))
}

/**
 * 处理单个 fc:// 协议请求
 *
 * @param request - Electron ProtocolRequest 对象
 * @returns Response 对象（完整文件或 206 Range 片段）
 */
async function handleProtocolRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const filePath = resolveMediaFilePath(url)

  if (!filePath) {
    log.error(`[protocol] 非法文件路径: ${request.url}`)
    return new Response('Invalid media path', { status: 400 })
  }

  const ext = extname(filePath).toLowerCase()
  const contentType = MEDIA_MIME_TYPES[ext] || 'application/octet-stream'

  try {
    const stats = statSync(filePath)
    const fileSize = stats.size

    const rangeHeader = request.headers.get('range')
    if (rangeHeader) {
      return serveRangeRequest(filePath, fileSize, contentType, rangeHeader)
    }

    return serveFullFile(filePath, fileSize, contentType)
  } catch (err) {
    log.error(`[protocol] 文件读取失败: ${filePath}`, err)
    return new Response('File not found', { status: 404 })
  }
}

/**
 * 从 fc:// URL 中解析出本地文件绝对路径
 *
 * 支持两种 URL 格式：
 *   1. 新格式: fc://media/<encodeURIComponent(绝对路径)>
 *      例: fc://media/C%3A%2FUsers%2FAdmin%2Fvideo.mp4
 *   2. 旧格式: fc://C:/Users/Admin/video.mp4（兼容保留）
 *
 * 安全检查：
 *   - 必须返回绝对路径
 *   - 路径存在且可访问
 *
 * @param url - 解析后的 URL 对象
 * @returns 本地绝对路径，解析失败返回 null
 */
function resolveMediaFilePath(url: URL): string | null {
  // 新格式: fc://media/<encodedPath>
  if (url.hostname === 'media') {
    const encodedPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
    if (!encodedPath) return null

    const decodedPath = decodeURIComponent(encodedPath)
    const normalizedPath = normalize(decodedPath)
    return isAbsolute(normalizedPath) ? normalizedPath : null
  }

  // 兼容旧格式: fc://C:/Users/... 或 fc:///Users/...
  const legacyPath = decodeURIComponent(
    url.host ? `${url.host}${url.pathname}` : url.pathname
  )
  const normalizedLegacyPath = normalize(legacyPath)

  if (existsSync(normalizedLegacyPath) && isAbsolute(normalizedLegacyPath)) {
    return normalizedLegacyPath
  }

  // Unix 平台兜底：尝试补全前导斜杠
  if (process.platform !== 'win32') {
    const withLeadingSlash = normalize(`/${legacyPath.replace(/^\/+/, '')}`)
    if (existsSync(withLeadingSlash) && isAbsolute(withLeadingSlash)) {
      return withLeadingSlash
    }
  }

  return null
}

/**
 * 返回完整文件内容（200 OK）
 *
 * 使用 Node.js createReadStream 流式读取，避免大文件占用内存。
 * 通过 ReadableStream 将 Node 流桥接为 Web Streams API。
 */
 function serveFullFile(filePath: string, fileSize: number, contentType: string): Response {
  const nodeStream = createReadStream(filePath)
  const webStream = nodeStreamToWebStream(nodeStream)

  return new Response(webStream, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
    },
  })
}

/**
 * 返回文件指定范围片段（206 Partial Content）
 *
 * 视频播放器 seek、进度条拖动时会发起 Range 请求。
 * 必须正确返回 Content-Range 头，否则播放器无法定位到指定时间。
 *
 * @param rangeHeader - 原始 Range 请求头，如 "bytes=0-1023"
 */
function serveRangeRequest(
  filePath: string,
  fileSize: number,
  contentType: string,
  rangeHeader: string
): Response {
  const parts = rangeHeader.replace(/bytes=/, '').split('-')
  const start = parseInt(parts[0], 10)
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
  const chunkSize = end - start + 1

  const nodeStream = createReadStream(filePath, { start, end })
  const webStream = nodeStreamToWebStream(nodeStream)

  return new Response(webStream, {
    status: 206,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(chunkSize),
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
    },
  })
}

/**
 * 将 Node.js ReadableStream 桥接为 Web Streams API 的 ReadableStream
 *
 * Electron 的 protocol.handle 要求返回 Web Standard 的 Response 对象，
 * 但 Node.js fs.createReadStream 是传统 EventEmitter 式流，需要手动桥接。
 *
 * @param nodeStream - Node.js fs.createReadStream 创建的流
 * @returns Web Standard ReadableStream
 */
function nodeStreamToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(chunk))
      nodeStream.on('end', () => controller.close())
      nodeStream.on('error', (err) => controller.error(err))
    },
    cancel() {
      // @ts-ignore
      nodeStream.destroy()
    },
  })
}

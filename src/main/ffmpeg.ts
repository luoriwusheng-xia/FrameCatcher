import { spawn } from 'child_process'
import { join } from 'path'

/**
 * 视频元信息接口
 * 由 ffprobe 解析得到，包含格式、时长、分辨率、码率等关键信息
 */
export interface VideoInfo {
  format: string
  duration: number
  width: number
  height: number
  bitrate: number
  size: number
}

/**
 * 判断当前是否处于打包后的生产环境
 * 开发环境存在 ELECTRON_RENDERER_URL 环境变量，生产环境不存在
 */
function isPackaged(): boolean {
  return !process.env['ELECTRON_RENDERER_URL']
}

/**
 * 获取 FFmpeg 可执行文件的绝对路径
 *
 * 路径规则：
 * - 开发环境：项目根目录 resources/ffmpeg/bin/ffmpeg.exe
 * - 生产环境：process.resourcesPath/ffmpeg/bin/ffmpeg.exe（electron-builder 将 resources 目录打包至此）
 */
export function getFFmpegPath(): string {
  if (isPackaged()) {
    return join(process.resourcesPath, 'ffmpeg/bin/ffmpeg.exe')
  }
  return join(__dirname, '../../resources/ffmpeg/bin/ffmpeg.exe')
}

/**
 * 获取 FFprobe 可执行文件的绝对路径
 * 与 getFFmpegPath 遵循相同的路径规则
 */
function getFFprobePath(): string {
  if (isPackaged()) {
    return join(process.resourcesPath, 'ffmpeg/bin/ffprobe.exe')
  }
  return join(__dirname, '../../resources/ffmpeg/bin/ffprobe.exe')
}

/**
 * 执行外部命令的通用封装
 *
 * 使用 Node.js child_process.spawn 创建子进程，避免阻塞主进程事件循环。
 * 收集 stdout/stderr 输出，返回退出码。
 *
 * @param command 可执行文件路径
 * @param args 命令行参数数组
 * @returns 包含 stdout、stderr 和退出码的结果对象
 */
function runCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn process: ${error.message}`))
    })

    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 })
    })
  })
}

/**
 * 检测 FFmpeg 是否可用
 * 执行 `ffmpeg -version`，成功返回 true，失败返回 false
 * 用于应用启动时的环境检查
 */
export async function checkFFmpeg(): Promise<boolean> {
  const ffmpegPath = getFFmpegPath()
  try {
    const result = await runCommand(ffmpegPath, ['-version'])
    return result.code === 0
  } catch {
    return false
  }
}

/**
 * 视频格式转换
 *
 * 使用 FFmpeg 将输入视频转码为指定格式的输出文件。
 * 支持任意输入格式（mp4/webm/mkv/avi 等），输出格式由文件扩展名决定。
 *
 * @param input 输入视频文件路径
 * @param output 输出视频文件路径
 */
export async function convertVideo(input: string, output: string): Promise<void> {
  const ffmpegPath = getFFmpegPath()

  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, ['-i', input, '-y', output], { windowsHide: true })
    let stderr = ''

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    child.on('error', (error) => {
      reject(new Error(`FFmpeg process error: ${error.message}`))
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg convert failed (exit code ${code}): ${stderr}`))
      }
    })
  })
}

/**
 * 获取视频元信息
 *
 * 使用 FFprobe 以 JSON 格式输出视频的格式和流信息，解析后返回结构化的 VideoInfo。
 * 支持的格式：mp4、webm、mkv、avi、mov 等 FFmpeg 支持的所有格式。
 *
 * @param input 视频文件路径
 * @returns VideoInfo 对象，包含格式、时长、分辨率、码率、文件大小
 */
export async function probeVideo(input: string): Promise<VideoInfo> {
  const ffprobePath = getFFprobePath()

  const result = await runCommand(ffprobePath, [
    '-v', 'error',
    '-show_entries', 'format=format_name,duration,bit_rate,size',
    '-show_entries', 'stream=width,height',
    '-select_streams', 'v:0',
    '-of', 'json',
    input
  ])

  if (result.code !== 0) {
    throw new Error(`FFprobe failed: ${result.stderr}`)
  }

  let parsed: {
    format?: { format_name?: string; duration?: string; bit_rate?: string; size?: string }
    streams?: Array<{ width?: number; height?: number }>
  }

  try {
    parsed = JSON.parse(result.stdout)
  } catch {
    throw new Error('Failed to parse ffprobe output')
  }

  const format = parsed.format?.format_name ?? 'unknown'
  const duration = parseFloat(parsed.format?.duration ?? '0')
  const bitrate = parseInt(parsed.format?.bit_rate ?? '0', 10)
  const size = parseInt(parsed.format?.size ?? '0', 10)
  const width = parsed.streams?.[0]?.width ?? 0
  const height = parsed.streams?.[0]?.height ?? 0

  return {
    format,
    duration,
    width,
    height,
    bitrate,
    size
  }
}

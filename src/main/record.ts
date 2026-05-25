import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { getConfig, setConfig } from './config'
import { convertVideo } from './ffmpeg'
import { app } from 'electron'

/**
 * 录制记录数据结构
 */
export interface RecordEntry {
  id: string
  name: string
  path: string
  duration: number
  size: number
  createdAt: number
  mode: string
}

/**
 * 获取输出目录
 * 如果配置中没有设置，使用用户视频目录下的 FrameCatcher 文件夹
 */
function getOutputDir(): string {
  const configDir = getConfig('general.outputDir') as string | undefined
  if (configDir && configDir.trim().length > 0) {
    return configDir
  }
  // 使用 Electron 的 app.getPath 获取用户视频目录
  return join(app.getPath('videos'), 'FrameCatcher')
}

/**
 * 确保输出目录存在
 */
function ensureDir(dir: string): void {
  const { mkdirSync } = require('fs')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 格式化时长为 mm:ss 或 hh:mm:ss
 */
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * 保存录制文件
 *
 * 流程：
 * 1. 将录制数据写入 .webm 临时文件
 * 2. 使用 FFmpeg 转换为 .mp4
 * 3. 删除临时 .webm 文件
 * 4. 将录制信息存入配置
 */
export async function saveRecording(
  buffer: Buffer,
  meta: { mode: string; duration: number; mimeType: string }
): Promise<RecordEntry> {
  const outputDir = getOutputDir()
  ensureDir(outputDir)

  const id = generateId()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const modeLabel = meta.mode === 'window' ? '窗口' : meta.mode === 'area' ? '区域' : '音频'
  const name = `${modeLabel}录制 ${formatDuration(meta.duration)} ${timestamp}`

  const tempPath = join(outputDir, `${id}.webm`)
  const finalPath = join(outputDir, `${id}.mp4`)

  // 写入临时 webm 文件
  writeFileSync(tempPath, buffer)

  // 尝试用 FFmpeg 转换为 mp4
  try {
    await convertVideo(tempPath, finalPath)
    // 转换成功后删除临时文件
    if (existsSync(tempPath)) {
      unlinkSync(tempPath)
    }
  } catch {
    // FFmpeg 转换失败，保留 webm 格式
    console.warn('FFmpeg conversion failed, keeping webm format')
  }

  const actualPath = existsSync(finalPath) ? finalPath : tempPath
  const actualExt = existsSync(finalPath) ? '.mp4' : '.webm'
  const actualName = `${name}${actualExt}`
  const { statSync } = require('fs')
  const size = statSync(actualPath).size

  const entry: RecordEntry = {
    id,
    name: actualName,
    path: actualPath,
    duration: meta.duration,
    size,
    createdAt: Date.now(),
    mode: meta.mode,
  }

  // 保存到配置
  const records = getRecords()
  records.unshift(entry)
  setConfig('records', records)

  return entry
}

/**
 * 获取录制列表
 */
export function getRecords(): RecordEntry[] {
  const records = getConfig('records') as RecordEntry[] | undefined
  if (!Array.isArray(records)) {
    return []
  }
  // 过滤掉文件已被删除的记录
  const validRecords = records.filter((r) => existsSync(r.path))
  if (validRecords.length !== records.length) {
    setConfig('records', validRecords)
  }
  return validRecords
}

/**
 * 删除录制
 */
export async function deleteRecord(id: string): Promise<void> {
  const records = getRecords()
  const index = records.findIndex((r) => r.id === id)
  if (index === -1) {
    throw new Error('Record not found')
  }

  const record = records[index]

  // 删除物理文件
  try {
    if (existsSync(record.path)) {
      unlinkSync(record.path)
    }
  } catch (err) {
    console.error('Failed to delete file:', err)
  }

  // 从列表中移除
  records.splice(index, 1)
  setConfig('records', records)
}

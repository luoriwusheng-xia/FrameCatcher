import { ipcMain, type App, type BrowserWindow } from 'electron'
import { checkFFmpeg, convertVideo, probeVideo } from './ffmpeg'
import { getConfig, setConfig, getAllConfig } from './config'

/**
 * IPC 依赖上下文
 *
 * 将 mainWindow 和 app 以引用对象的形式传入，实现模块解耦：
 * - mainWindow 在生命周期中可能为 null（窗口关闭后），使用 getter 实时获取当前值
 * - app 为 Electron App 实例，提供全局应用能力
 */
export interface IpcContext {
  /** 主窗口引用，使用 getter 实时获取当前窗口实例（可能为 null） */
  mainWindow: { current: BrowserWindow | null }
  /** Electron App 实例 */
  app: App
}

/**
 * 注册所有 IPC 事件处理器
 *
 * 按功能分为三组：
 * 1. 配置读写 — 持久化到 electron-store
 * 2. FFmpeg 视频处理 — 格式转换、元信息获取
 * 3. 窗口控制 — 关闭、最小化、最大化/还原
 *
 * 所有 IPC 通道均通过 contextBridge 安全暴露给渲染进程，
 * 渲染进程无法直接访问 Node.js API。
 */
export function registerIpcHandlers(ctx: IpcContext): void {
  // ─── 配置读写 ───────────────────────────────────
  // 渲染进程通过 window.api.config.{get,set,getAll} 调用

  ipcMain.handle('config:get', (_, key: string) => {
    return getConfig(key)
  })

  ipcMain.handle('config:set', (_, key: string, value: unknown) => {
    setConfig(key, value)
  })

  ipcMain.handle('config:get-all', () => {
    return getAllConfig()
  })

  // ─── FFmpeg 视频处理 ────────────────────────────
  // 渲染进程通过 window.api.ffmpeg.{check,convert,probe} 调用

  /** 检测 FFmpeg 是否可用 */
  ipcMain.handle('ffmpeg:check', () => {
    return checkFFmpeg()
  })

  /** 视频格式转换：输入文件路径 -> 输出文件路径 */
  ipcMain.handle('ffmpeg:convert', (_, input: string, output: string) => {
    return convertVideo(input, output)
  })

  /** 获取视频元信息：时长、分辨率、码率、文件大小等 */
  ipcMain.handle('ffmpeg:probe', (_, input: string) => {
    return probeVideo(input)
  })

  // ─── 窗口控制 ───────────────────────────────────
  // 由渲染进程标题栏按钮触发

  /** 关闭主窗口 */
  ipcMain.on('window:close', () => {
    ctx.mainWindow.current?.close()
  })

  /** 最小化主窗口 */
  ipcMain.on('window:minimize', () => {
    ctx.mainWindow.current?.minimize()
  })

  /** 最大化/还原主窗口 */
  ipcMain.on('window:maximize', () => {
    const win = ctx.mainWindow.current
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })
}

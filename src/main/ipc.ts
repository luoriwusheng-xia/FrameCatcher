import { BrowserWindow, ipcMain, shell, type App } from 'electron'
import { checkFFmpeg, convertVideo, probeVideo } from './ffmpeg'
import { getConfig, setConfig, getAllConfig } from './config'
import { saveRecording, getRecords, deleteRecord } from './record'
import { getWindowSources, openAreaSelector, registerAreaSelectorIpc } from './recorder'
import { registerPlayerIpc } from './player'

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
 * 按功能分为四组：
 * 1. 配置读写 — 持久化到 electron-store
 * 2. FFmpeg 视频处理 — 格式转换、元信息获取
 * 3. 窗口控制 — 关闭、最小化、最大化/还原
 * 4. 录制管理 — 窗口源获取、区域选择、文件保存、录制列表
 *
 * 所有 IPC 通道均通过 contextBridge 安全暴露给渲染进程，
 * 渲染进程无法直接访问 Node.js API。
 */
export function registerIpcHandlers(_ctx: IpcContext): void {
  function getSenderWindow(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): BrowserWindow | null {
    return BrowserWindow.fromWebContents(event.sender)
  }

  // ─── 配置读写 ───────────────────────────────────

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

  ipcMain.handle('ffmpeg:check', () => {
    return checkFFmpeg()
  })

  ipcMain.handle('ffmpeg:convert', (_, input: string, output: string) => {
    return convertVideo(input, output)
  })

  ipcMain.handle('ffmpeg:probe', (_, input: string) => {
    return probeVideo(input)
  })

  // ─── 窗口控制 ───────────────────────────────────

  ipcMain.on('window:close', (event) => {
    getSenderWindow(event)?.close()
  })

  ipcMain.on('window:minimize', (event) => {
    getSenderWindow(event)?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const win = getSenderWindow(event)
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  // ─── 录制源获取 ─────────────────────────────────

  ipcMain.handle('recorder:get-sources', async () => {
    return getWindowSources()
  })

  ipcMain.handle('recorder:open-area-selector', async () => {
    return openAreaSelector()
  })

  // ─── 录制文件管理 ───────────────────────────────

  ipcMain.handle('record:save', async (_, arrayBuffer: ArrayBuffer, meta: { mode: string; duration: number; mimeType: string }) => {
    return saveRecording(Buffer.from(arrayBuffer), meta)
  })

  ipcMain.handle('record:list', () => {
    return getRecords()
  })

  ipcMain.handle('record:delete', (_, id: string) => {
    return deleteRecord(id)
  })

  ipcMain.handle('record:show-in-folder', (_, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  // ─── 区域选择窗口 IPC ───────────────────────────

  registerAreaSelectorIpc()
  registerPlayerIpc()

  ipcMain.handle('ping', () => 'pong')
}

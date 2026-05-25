import { desktopCapturer, BrowserWindow, screen, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export interface DesktopCapturerSource {
  id: string
  name: string
  thumbnailDataUrl: string
}

let areaSelectorWindow: BrowserWindow | null = null
let areaSelectorResolve: ((area: { x: number; y: number; width: number; height: number } | null) => void) | null = null

/**
 * 获取可录制的窗口和屏幕源列表
 */
export async function getWindowSources(): Promise<DesktopCapturerSource[]> {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 320, height: 240 }
  })
  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnailDataUrl: source.thumbnail.toDataURL()
  }))
}

/**
 * 创建区域选择窗口
 * 全屏无边框透明窗口，用于用户框选录制区域
 */
export function openAreaSelector(): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    // 如果已有区域选择窗口，先关闭
    if (areaSelectorWindow && !areaSelectorWindow.isDestroyed()) {
      areaSelectorWindow.close()
    }

    areaSelectorResolve = resolve

    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize

    areaSelectorWindow = new BrowserWindow({
      width,
      height,
      frame: false,
      fullscreen: true,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      focusable: true,
      hasShadow: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // 加载区域选择页面
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      areaSelectorWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/area-selector`)
    } else {
      areaSelectorWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: '/area-selector'
      })
    }

    // 窗口关闭时清理
    areaSelectorWindow.on('closed', () => {
      areaSelectorWindow = null
      if (areaSelectorResolve) {
        areaSelectorResolve(null)
        areaSelectorResolve = null
      }
    })
  })
}

/**
 * 关闭区域选择窗口并返回结果
 */
export function closeAreaSelector(area: { x: number; y: number; width: number; height: number } | null): void {
  if (areaSelectorResolve) {
    areaSelectorResolve(area)
    areaSelectorResolve = null
  }
  if (areaSelectorWindow && !areaSelectorWindow.isDestroyed()) {
    areaSelectorWindow.close()
    areaSelectorWindow = null
  }
}

/**
 * 注册区域选择相关的 IPC 事件
 * 供 AreaSelector.vue 独立窗口使用
 */
export function registerAreaSelectorIpc(): void {
  ipcMain.handle('area-selector:confirm', (_, area: { x: number; y: number; width: number; height: number }) => {
    closeAreaSelector(area)
  })

  ipcMain.handle('area-selector:cancel', () => {
    closeAreaSelector(null)
  })
}

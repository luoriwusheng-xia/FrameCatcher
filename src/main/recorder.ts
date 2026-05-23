import { desktopCapturer, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export interface DesktopCapturerSource {
  id: string
  name: string
  thumbnail: Electron.NativeImage
}

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
    thumbnail: source.thumbnail
  }))
}

/**
 * 创建区域选择窗口
 * 全屏无边框透明窗口，用于用户框选录制区域
 */
export function createAreaSelectorWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  const selectorWindow = new BrowserWindow({
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
    selectorWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/area-selector`)
  } else {
    // 生产环境使用 about:blank 或本地 HTML，后续可替换为实际页面
    selectorWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/area-selector'
    })
  }

  // 窗口关闭时清理
  selectorWindow.on('closed', () => {
    // 清理逻辑由调用方处理
  })

  return selectorWindow
}

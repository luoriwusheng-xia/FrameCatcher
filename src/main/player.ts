import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let playerWindow: BrowserWindow | null = null
let currentPlayerSource = ''

function loadPlayerRoute(window: BrowserWindow): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/player`)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/player'
    })
  }
}

function focusPlayerWindow(window: BrowserWindow): void {
  if (window.isMinimized()) {
    window.restore()
  }

  window.show()
  window.focus()
  window.moveTop()
}

function sendPlayerSource(): void {
  if (!playerWindow || playerWindow.isDestroyed() || !currentPlayerSource) {
    return
  }

  playerWindow.webContents.send('player:load', currentPlayerSource)
}

export function getCurrentPlayerSource(): string {
  return currentPlayerSource
}

export function openPlayerWindow(filePath: string): void {
  if (!filePath) return

  currentPlayerSource = filePath

  if (playerWindow && !playerWindow.isDestroyed()) {
    focusPlayerWindow(playerWindow)
    sendPlayerSource()
    return
  }

  playerWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 560,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    title: 'FrameCatcher Player',
    backgroundColor: '#0a0a0f',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  playerWindow.once('ready-to-show', () => {
    if (!playerWindow) return
    focusPlayerWindow(playerWindow)
  })

  playerWindow.webContents.once('did-finish-load', () => {
    sendPlayerSource()
  })

  playerWindow.on('closed', () => {
    playerWindow = null
  })

  loadPlayerRoute(playerWindow)
}

export function registerPlayerIpc(): void {
  ipcMain.handle('player:open', (_, filePath: string) => {
    openPlayerWindow(filePath)
  })

  ipcMain.handle('player:get-current-source', () => {
    return currentPlayerSource
  })
}

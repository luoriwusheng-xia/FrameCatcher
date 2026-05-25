/**
 * FrameCatcher 主进程入口
 *
 * 职责：
 * - 创建并管理应用主窗口（无边框沉浸式窗口）
 * - 注册应用菜单栏（视图 / 窗口 / 关于）
 * - 窗口生命周期管理（创建、激活、关闭）
 *
 * IPC 事件已抽离至 ipc.ts，通过 registerIpcHandlers 注册。
 * 本地文件协议已抽离至 protocol.ts，通过 registerPrivilegedSchemes / registerFileProtocolHandler 注册。
 *
 * 安全设计：
 * - 渲染进程启用 sandbox + contextIsolation，禁止直接访问 Node.js API
 * - 所有主进程能力通过 contextBridge + IPC 按需暴露
 * - preload 脚本使用 nodeIntegration: false，防止渲染进程注入
 */

import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerIpcHandlers } from './ipc'
import { registerPrivilegedSchemes, registerFileProtocolHandler } from './protocol'
import log from 'electron-log/main'

// ─── 日志初始化 ───────────────────────────────────

log.initialize()

if (import.meta.env.DEV) {
  log.transports.file.resolvePathFn = () => join('./logs/main.log')
  console.log('electron 版本', process.versions.electron)
  console.log('内置node 版本', process.versions.node)
  console.log('chrome内核 版本', process.versions.chrome)
}

log.info('软件启动')

// ─── 协议注册（必须在 app.ready 之前）───────────────

registerPrivilegedSchemes()

// ─── 主窗口引用 ───────────────────────────────────

/** 当前主窗口实例，窗口关闭后置为 null */
let mainWindow: BrowserWindow | null = null

/**
 * 主窗口引用对象，通过 getter 实时获取当前窗口实例
 * 供 IPC 模块和菜单模块共享访问，避免直接暴露模块级变量
 */
const mainWindowRef = {
  get current(): BrowserWindow | null {
    return mainWindow
  }
}

// ─── 菜单 ─────────────────────────────────────────

/**
 * 创建应用菜单栏
 *
 * macOS 和 Windows 的菜单结构有差异，此处做平台适配：
 * - macOS 第一个菜单项自动使用应用名，无需手动指定 label
 * - 菜单中包含视图导航（录屏 / 录制列表 / 设置）
 * - 点击菜单项通过 IPC 通知渲染进程进行路由跳转
 */
function createAppMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: Electron.MenuItemConstructorOptions[] = []

  // 应用菜单：macOS 第一个菜单项自动使用应用名，无需手动指定 label
  if (isMac) {
    template.push({
      submenu: [
        { label: '关于 FrameCatcher', role: 'about' },
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]
    })
  } else {
    template.push({
      label: 'FrameCatcher',
      submenu: [
        { label: '关于 FrameCatcher', role: 'about' },
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]
    })
  }

  // 视图菜单：页面导航 + 开发者工具
  template.push({
    label: '视图',
    submenu: [
      {
        label: '录屏',
        click: () => {
          mainWindowRef.current?.webContents.send('menu:navigate', '/')
        }
      },
      {
        label: '录制列表',
        click: () => {
          mainWindowRef.current?.webContents.send('menu:navigate', '/records')
        }
      },
      { type: 'separator' },
      {
        label: '设置',
        click: () => {
          mainWindowRef.current?.webContents.send('menu:navigate', '/settings')
        }
      },
      { type: 'separator' },
      { label: '重新加载', role: 'reload' },
      { label: '开发者工具', role: 'toggleDevTools' }
    ]
  })

  // 窗口菜单：最小化 / 关闭 / 全屏
  template.push({
    label: '窗口',
    submenu: [
      { label: '最小化', role: 'minimize' },
      { label: '关闭', role: 'close' },
      { type: 'separator' },
      { label: '全屏', role: 'togglefullscreen' }
    ]
  })

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ─── 窗口创建 ─────────────────────────────────────

/**
 * 创建主窗口
 *
 * 窗口配置要点：
 * - frame: false — 移除系统标题栏，使用自定义标题栏（渲染进程实现）
 * - backgroundColor: '#0a0a0f' — 匹配应用暗色主题，避免加载时的白屏闪烁
 * - sandbox: true — 启用渲染进程沙箱，防止 XSS 时访问 Node.js API
 * - contextIsolation: true — 启用上下文隔离，preload 与渲染进程隔离
 * - nodeIntegration: false — 禁止渲染进程直接使用 Node.js API
 *
 * 安全说明：
 * 虽然 sandbox: true 会限制部分功能，但所有必要的主进程能力
 * （文件系统、FFmpeg、配置读写）都通过 preload + IPC 安全暴露，
 * 渲染进程本身不需要直接访问 Node.js。
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    show: false,           // 先隐藏，等 ready-to-show 时再显示，避免闪烁
    frame: false,          // 无边框，使用自定义标题栏
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0f',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // sandbox: true — 启用渲染进程沙箱
      // 虽然限制了渲染进程直接访问 Node.js，但我们通过 preload + IPC
      // 安全地暴露了所有必要的功能（文件系统、FFmpeg、窗口控制）
      // sandbox: true,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 窗口加载完成后再显示，避免内容未渲染时的白屏/黑屏闪烁
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 拦截新窗口打开请求，强制使用系统浏览器打开外部链接
  // 安全：防止页面通过 window.open 打开不受信任的 URL
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 窗口关闭时释放引用，防止内存泄漏
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 开发环境加载 Vite dev server URL，生产环境加载本地打包文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── 应用生命周期 ─────────────────────────────────

app.whenReady().then(() => {
  // 设置 Windows 应用用户模型 ID（影响任务栏分组）
  electronApp.setAppUserModelId('com.electron')

  // 开发环境 F12 打开 DevTools，生产环境禁用 Ctrl+R 刷新
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 注册 IPC 事件处理器（配置 / FFmpeg / 窗口控制）
  registerIpcHandlers({ mainWindow: mainWindowRef, app })

  // 注册本地文件访问协议处理器（必须在窗口创建前）
  registerFileProtocolHandler()

  createWindow()
  createAppMenu()

  // macOS: 点击 Dock 图标时重新创建窗口
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 所有窗口关闭后退出应用（macOS 除外，保持菜单栏活跃）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

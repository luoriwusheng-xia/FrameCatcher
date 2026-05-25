import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  media: {
    toFileUrl: (filePath: string) => `fc://media/${encodeURIComponent(filePath)}`
  },
  player: {
    open: (filePath: string) => ipcRenderer.invoke('player:open', filePath),
    getCurrentSource: () => ipcRenderer.invoke('player:get-current-source'),
    onLoad: (callback: (filePath: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath)
      ipcRenderer.on('player:load', listener)
      return () => ipcRenderer.removeListener('player:load', listener)
    }
  },
  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
    getAll: () => ipcRenderer.invoke('config:get-all')
  },
  ffmpeg: {
    check: () => ipcRenderer.invoke('ffmpeg:check'),
    convert: (input: string, output: string) =>
      ipcRenderer.invoke('ffmpeg:convert', input, output),
    probe: (input: string) => ipcRenderer.invoke('ffmpeg:probe', input)
  },
  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize')
  },
  recorder: {
    getSources: () => ipcRenderer.invoke('recorder:get-sources'),
    openAreaSelector: () => ipcRenderer.invoke('recorder:open-area-selector')
  },
  record: {
    save: (arrayBuffer: ArrayBuffer, meta: { mode: string; duration: number; mimeType: string }) =>
      ipcRenderer.invoke('record:save', arrayBuffer, meta),
    list: () => ipcRenderer.invoke('record:list'),
    delete: (id: string) => ipcRenderer.invoke('record:delete', id),
    showInFolder: (filePath: string) => ipcRenderer.invoke('record:show-in-folder', filePath)
  },
  areaSelector: {
    confirm: (area: { x: number; y: number; width: number; height: number }) =>
      ipcRenderer.invoke('area-selector:confirm', area),
    cancel: () => ipcRenderer.invoke('area-selector:cancel')
  },

  ping: () => ipcRenderer.invoke('ping')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.log('preload 注入方法失败')
  }
} else {
  // @ts-ignore
  window.api = api
}

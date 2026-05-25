import { ElectronAPI } from '@electron-toolkit/preload'

interface VideoInfo {
  format: string
  duration: number
  width: number
  height: number
  bitrate: number
  size: number
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      media: {
        toFileUrl: (filePath: string) => string
      }
      player: {
        open: (filePath: string) => Promise<void>
        getCurrentSource: () => Promise<string>
        onLoad: (callback: (filePath: string) => void) => () => void
      }
      config: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<void>
        getAll: () => Promise<Record<string, Record<string, unknown>>>
      }
      ffmpeg: {
        check: () => Promise<boolean>
        convert: (input: string, output: string) => Promise<void>
        probe: (input: string) => Promise<VideoInfo>
      }
      window: {
        close: () => void
        minimize: () => void
        maximize: () => void
      }
      recorder: {
        getSources: () => Promise<Array<{ id: string; name: string; thumbnailDataUrl: string }>>
        openAreaSelector: () => Promise<{ x: number; y: number; width: number; height: number } | null>
      }
      record: {
        save: (arrayBuffer: ArrayBuffer, meta: { mode: string; duration: number; mimeType: string }) => Promise<{
          id: string
          name: string
          path: string
          duration: number
          size: number
          createdAt: number
          mode: string
        }>
        list: () => Promise<Array<{
          id: string
          name: string
          path: string
          duration: number
          size: number
          createdAt: number
          mode: string
        }>>
        delete: (id: string) => Promise<void>
        showInFolder: (filePath: string) => Promise<void>
      }
      areaSelector: {
        confirm: (area: { x: number; y: number; width: number; height: number }) => Promise<void>
        cancel: () => Promise<void>
      }

      ping: () => string
    }
  }
}

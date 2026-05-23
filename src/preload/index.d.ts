import { ElectronAPI } from '@electron-toolkit/preload'
import type { VideoInfo } from '../main/ffmpeg'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      config: {
        getAll: () => Promise<Record<string, Record<string, unknown>>>
        set: (section: string, data: Record<string, unknown>) => Promise<void>
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
    }
  }
}

import Store from 'electron-store'

/**
 * 配置数据结构定义
 *
 * 配置分为三个区域，与渲染进程的 AppSettings/GeneralConfig/AudioConfig/WatermarkConfig 对应：
 * - general: 常规设置（保存路径等）
 * - audio: 音频设置（设备选择、音量）
 * - watermark: 水印设置（开关、文字/图片配置）
 */
interface ConfigSchema {
  general: { outputDir: string }
  audio: {
    micVolume: number
    speakerVolume: number
    defaultMic: string
    defaultSpeaker: string
  }
  watermark: {
    enabled: boolean
    type: string
    text: string
    textColor: string
    fontSize: number
    density: string
    imagePath: string
    imageOpacity: number
  }
}

/**
 * 配置存储实例
 *
 * electron-store 将配置持久化到操作系统标准配置目录：
 * - Windows: %APPDATA%/FrameCatcher/config.json
 * - macOS: ~/Library/Application Support/FrameCatcher/config.json
 * - Linux: ~/.config/FrameCatcher/config.json
 *
 * 默认值说明：
 * - outputDir 为空字符串，运行时若为空则使用用户视频目录下的 FrameCatcher 文件夹
 * - 音量默认值 80，兼顾清晰度与避免爆音
 * - 水印默认关闭
 */
const configStore = new Store<ConfigSchema>({
  defaults: {
    general: {
      outputDir: ''
    },
    audio: {
      micVolume: 80,
      speakerVolume: 80,
      defaultMic: 'default',
      defaultSpeaker: 'default'
    },
    watermark: {
      enabled: false,
      type: 'none',
      text: '',
      textColor: '#ffffff',
      fontSize: 24,
      density: 'medium',
      imagePath: '',
      imageOpacity: 50
    }
  }
})

/**
 * 读取单个配置项
 * @param key 配置键名，支持点分隔路径（如 'audio.micVolume'）
 * @returns 配置值，类型为 unknown（调用方需自行断言）
 */
export function getConfig(key: string): unknown {
  return configStore.get(key)
}

/**
 * 写入单个配置项
 * @param key 配置键名，支持点分隔路径
 * @param value 配置值
 */
export function setConfig(key: string, value: unknown): void {
  configStore.set(key, value)
}

/**
 * 读取全部配置
 * @returns 完整的 ConfigSchema 对象
 */
export function getAllConfig(): ConfigSchema {
  return configStore.store
}

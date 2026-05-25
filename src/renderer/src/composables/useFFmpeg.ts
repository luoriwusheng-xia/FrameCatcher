import { ref } from 'vue'

export interface VideoInfo {
  format: string
  duration: number
  width: number
  height: number
  bitrate: number
  size: number
}

export function useFFmpeg() {
  const isAvailable = ref(false)
  const converting = ref(false)
  const progress = ref(0)

  async function checkFFmpeg(): Promise<boolean> {
    try {
      isAvailable.value = await window.api.ffmpeg.check()
      return isAvailable.value
    } catch {
      isAvailable.value = false
      return false
    }
  }

  async function convertVideo(input: string, output: string): Promise<void> {
    converting.value = true
    progress.value = 0
    try {
      await window.api.ffmpeg.convert(input, output)
    } finally {
      converting.value = false
      progress.value = 100
    }
  }

  async function probeVideo(input: string): Promise<VideoInfo> {
    return await window.api.ffmpeg.probe(input)
  }

  return {
    isAvailable,
    converting,
    progress,
    checkFFmpeg,
    convertVideo,
    probeVideo
  }
}

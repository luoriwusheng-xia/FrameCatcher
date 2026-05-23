import { ref, computed } from 'vue'

export type RecordMode = 'window' | 'area' | 'audio'

export interface RecorderState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  mode: RecordMode | null
}

export interface RecordArea {
  x: number
  y: number
  width: number
  height: number
}

export function useRecorder() {
  const isRecording = ref(false)
  const isPaused = ref(false)
  const duration = ref(0)
  const mode = ref<RecordMode | null>(null)
  const mediaRecorder = ref<MediaRecorder | null>(null)
  const recordedChunks = ref<Blob[]>([])
  const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)

  const formattedDuration = computed(() => {
    const hrs = Math.floor(duration.value / 3600)
    const mins = Math.floor((duration.value % 3600) / 60)
    const secs = duration.value % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  async function startRecording(
    recordMode: RecordMode,
    _sourceId?: string,
    _area?: RecordArea
  ) {
    // TODO: 根据 mode 获取对应的 MediaStream
    // window mode: desktopCapturer source
    // area mode: screen capture with constraints
    // audio mode: only audio tracks

    // 现在先实现基础框架
    recordedChunks.value = []
    mode.value = recordMode
    isRecording.value = true
    isPaused.value = false
    duration.value = 0

    timerInterval.value = setInterval(() => {
      duration.value++
    }, 1000)
  }

  function pauseRecording() {
    if (mediaRecorder.value && isRecording.value && !isPaused.value) {
      mediaRecorder.value.pause()
      isPaused.value = true
    }
  }

  function resumeRecording() {
    if (mediaRecorder.value && isRecording.value && isPaused.value) {
      mediaRecorder.value.resume()
      isPaused.value = false
    }
  }

  function stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }

      // TODO: 实际停止 MediaRecorder
      isRecording.value = false
      isPaused.value = false
      mode.value = null

      // 返回一个空 blob 作为占位
      resolve(new Blob(recordedChunks.value, { type: 'video/webm' }))
    })
  }

  return {
    isRecording,
    isPaused,
    duration,
    formattedDuration,
    mode,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording
  }
}

import { ref, computed, shallowRef } from 'vue'

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

export interface WindowSource {
  id: string
  name: string
  thumbnailDataUrl: string
}

export interface SavedRecord {
  id: string
  name: string
  path: string
  thumbnail?: string
  duration: number
  size: number
  createdAt: number
  mode: RecordMode
}

export function useRecorder() {
  const isRecording = ref(false)
  const isPaused = ref(false)
  const duration = ref(0)
  const mode = ref<RecordMode | null>(null)
  const mediaRecorder = shallowRef<MediaRecorder | null>(null)
  const recordedChunks = ref<Blob[]>([])
  const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const previewStream = shallowRef<MediaStream | null>(null)
  const livePreviewStream = shallowRef<MediaStream | null>(null)
  const saveError = ref<string | null>(null)

  // 窗口源列表（窗口录制模式）
  const windowSources = ref<WindowSource[]>([])
  const selectedSourceId = ref('')
  const sourcesLoading = ref(false)

  // 区域（区域录制模式）
  const selectedArea = ref<RecordArea | null>(null)

  const formattedDuration = computed(() => {
    const hrs = Math.floor(duration.value / 3600)
    const mins = Math.floor((duration.value % 3600) / 60)
    const secs = duration.value % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  /**
   * 获取窗口源列表
   */
  async function fetchWindowSources() {
    sourcesLoading.value = true
    try {
      const sources = await window.api.recorder.getSources()
      windowSources.value = sources
      // 默认选中第一个窗口
      if (sources.length > 0 && !selectedSourceId.value) {
        selectedSourceId.value = sources[0].id
      }
    } catch (err) {
      console.error('Failed to fetch window sources:', err)
    } finally {
      sourcesLoading.value = false
    }
  }

  /**
   * 打开区域选择器
   */
  async function openAreaSelector(): Promise<RecordArea | null> {
    try {
      const area = await window.api.recorder.openAreaSelector()
      return area
    } catch (err) {
      console.error('Failed to open area selector:', err)
      return null
    }
  }

  /**
   * 获取指定 sourceId 的媒体流（窗口/屏幕录制用）
   */
  async function getSourceStream(sourceId: string): Promise<MediaStream> {
    const stream = await (navigator.mediaDevices as any).getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
        },
      },
    })
    return stream
  }

  /**
   * 获取区域录制的媒体流
   */
  async function getAreaStream(_area: RecordArea): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
      } as any,
      audio: true,
    })
    return stream
  }

  /**
   * 启动窗口实时预览
   */
  async function startLivePreview(sourceId: string) {
    stopLivePreview()
    if (!sourceId) return
    try {
      const stream = await getSourceStream(sourceId)
      livePreviewStream.value = stream
    } catch (err) {
      console.error('Failed to start live preview:', err)
    }
  }

  /**
   * 停止窗口实时预览
   */
  function stopLivePreview() {
    livePreviewStream.value?.getTracks().forEach((track) => track.stop())
    livePreviewStream.value = null
  }

  /**
   * 开始录制
   */
  async function startRecording(
    recordMode: RecordMode,
    options: {
      sourceId?: string
      area?: RecordArea
      includeMic?: boolean
      includeSystemAudio?: boolean
    } = {}
  ) {
    saveError.value = null
    recordedChunks.value = []
    mode.value = recordMode
    isRecording.value = true
    isPaused.value = false
    duration.value = 0

    try {
      let stream: MediaStream

      if (recordMode === 'window' && options.sourceId) {
        // 窗口录制：复用实时预览流，如果没有则重新获取
        if (livePreviewStream.value) {
          stream = livePreviewStream.value
          livePreviewStream.value = null
        } else {
          stream = await getSourceStream(options.sourceId)
        }
      } else if (recordMode === 'area') {
        // 区域录制：使用 getDisplayMedia
        stream = await getAreaStream(options.area!)
      } else if (recordMode === 'audio') {
        // 音频录制：只获取音频
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      } else {
        throw new Error('Invalid recording mode or missing required options')
      }

      // 如果需要麦克风，混合音频
      if (options.includeMic && recordMode !== 'audio') {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          micStream.getAudioTracks().forEach((track) => {
            stream.addTrack(track)
          })
        } catch {
          // 麦克风权限被拒绝
        }
      }

      previewStream.value = stream

      // 监听用户取消分享
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (isRecording.value) {
            stopRecording()
          }
        }
      })

      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      })
      mediaRecorder.value = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.value.push(event.data)
        }
      }

      recorder.onstop = () => {
        previewStream.value?.getTracks().forEach((track) => track.stop())
        previewStream.value = null
      }

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        saveError.value = '录制器出错'
      }

      recorder.start(1000)

      timerInterval.value = setInterval(() => {
        duration.value++
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      isRecording.value = false
      mode.value = null
      throw err
    }
  }

  function pauseRecording() {
    if (mediaRecorder.value && isRecording.value && !isPaused.value && mediaRecorder.value.state === 'recording') {
      mediaRecorder.value.pause()
      isPaused.value = true
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
    }
  }

  function resumeRecording() {
    if (mediaRecorder.value && isRecording.value && isPaused.value && mediaRecorder.value.state === 'paused') {
      mediaRecorder.value.resume()
      isPaused.value = false
      timerInterval.value = setInterval(() => {
        duration.value++
      }, 1000)
    }
  }

  /**
   * 停止录制并保存
   * @param outputFormat 输出格式，如 'mp4', 'webm'。如果为 'webm' 则直接保存原始 webm。
   */
  async function stopRecording(outputFormat: string = 'webm'): Promise<SavedRecord | null> {
    return new Promise((resolve) => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }

      const recorder = mediaRecorder.value
      if (!recorder || recorder.state === 'inactive') {
        cleanup()
        resolve(null)
        return
      }

      recorder.onstop = async () => {
        previewStream.value?.getTracks().forEach((track) => track.stop())
        previewStream.value = null

        const blob = new Blob(recordedChunks.value, { type: recorder.mimeType })
        const arrayBuffer = await blob.arrayBuffer()

        try {
          const record = await window.api.record.save(arrayBuffer, {
            mode: mode.value!,
            duration: duration.value,
            mimeType: recorder.mimeType,
          })

          // 如果用户选择了非 webm 格式，使用 FFmpeg 转码
          if (outputFormat !== 'webm' && record.path.endsWith('.webm')) {
            try {
              const newPath = record.path.replace(/\.webm$/, `.${outputFormat}`)
              await window.api.ffmpeg.convert(record.path, newPath)
              record.path = newPath
              record.name = record.name.replace(/\.webm$/, `.${outputFormat}`)
            } catch {
              // 转码失败，保留原始格式
            }
          }

          cleanup()
          resolve(record as SavedRecord)
        } catch (err) {
          console.error('Failed to save recording:', err)
          saveError.value = '保存录制文件失败'
          cleanup()
          resolve(null)
        }
      }

      recorder.stop()
    })
  }

  function cleanup() {
    isRecording.value = false
    isPaused.value = false
    mode.value = null
    mediaRecorder.value = null
    recordedChunks.value = []
    previewStream.value?.getTracks().forEach((track) => track.stop())
    previewStream.value = null
    stopLivePreview()
  }

  async function getRecords(): Promise<SavedRecord[]> {
    return window.api.record.list() as Promise<SavedRecord[]>
  }

  async function deleteRecord(id: string): Promise<void> {
    return window.api.record.delete(id)
  }

  return {
    isRecording,
    isPaused,
    duration,
    formattedDuration,
    mode,
    previewStream,
    livePreviewStream,
    saveError,
    windowSources,
    selectedSourceId,
    sourcesLoading,
    selectedArea,
    fetchWindowSources,
    openAreaSelector,
    startLivePreview,
    stopLivePreview,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    getRecords,
    deleteRecord,
  }
}

function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return 'video/webm'
}

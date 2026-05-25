<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Monitor,
  Square,
  Mic,
  Headphones,
  Video,
  Circle,
  Film,
  Settings,
} from 'lucide-vue-next'
import { useMediaDevices } from '../composables/useMediaDevices'
import { useRecorder, type RecordMode } from '../composables/useRecorder'
import RecordControls from '../components/recorder/RecordControls.vue'
import CountdownOverlay from '../components/recorder/CountdownOverlay.vue'

const { microphones, speakers, cameras, loading: devicesLoading } = useMediaDevices()
const {
  isRecording,
  isPaused,
  formattedDuration,
  previewStream,
  livePreviewStream,
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
} = useRecorder()

const activeTab = ref<RecordMode>('window')
const selectedMicrophone = ref('')
const selectedSpeaker = ref('')
const selectedCamera = ref('')
const showCountdown = ref(false)
const showFormatDialog = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const livePreviewVideoRef = ref<HTMLVideoElement | null>(null)

const tabs = [
  { key: 'window' as RecordMode, label: '窗口录制', icon: Monitor },
  { key: 'area' as RecordMode, label: '区域录制', icon: Square },
  { key: 'audio' as RecordMode, label: '音频录制', icon: Mic },
]

const outputFormats = ['webm', 'mp4', 'mov', 'avi']

// 切换标签时加载窗口源 / 停止实时预览
watch(activeTab, (tab, oldTab) => {
  if (tab === 'window') {
    fetchWindowSources()
  }
  if (oldTab === 'window' && tab !== 'window') {
    stopLivePreview()
  }
})

// 选中窗口变化时启动实时预览
watch(selectedSourceId, (id) => {
  if (activeTab.value === 'window' && id && !isRecording.value) {
    startLivePreview(id)
  }
})

// 录制结束后自动恢复实时预览
watch(isRecording, (recording) => {
  if (!recording && activeTab.value === 'window' && selectedSourceId.value) {
    // 录制结束，重新开始实时预览
    startLivePreview(selectedSourceId.value)
  }
})

// 录制预览流变化时绑定到 video 元素
watch(previewStream, (stream) => {
  if (stream && videoRef.value) {
    videoRef.value.srcObject = stream
    videoRef.value.play().catch(() => {})
  }
})

// 实时预览流变化时绑定到 live preview video 元素
watch(livePreviewStream, (stream) => {
  if (stream && livePreviewVideoRef.value) {
    livePreviewVideoRef.value.srcObject = stream
    livePreviewVideoRef.value.play().catch(() => {})
  }
})

async function handleStartRecording() {
  if (activeTab.value === 'area') {
    // 区域录制：先打开区域选择器
    const area = await openAreaSelector()
    if (!area) return
    selectedArea.value = area
  }
  showCountdown.value = true
}

async function onCountdownComplete() {
  showCountdown.value = false

  const options: {
    sourceId?: string
    area?: { x: number; y: number; width: number; height: number }
    includeMic?: boolean
    includeSystemAudio?: boolean
  } = {
    includeMic: selectedMicrophone.value !== 'none',
    includeSystemAudio: selectedSpeaker.value !== 'none',
  }

  if (activeTab.value === 'window') {
    options.sourceId = selectedSourceId.value
  } else if (activeTab.value === 'area') {
    options.area = selectedArea.value!
  }

  await startRecording(activeTab.value, options)
}

async function handleStopRecording() {
  // 直接停止，弹出格式选择对话框
  showFormatDialog.value = true
}

async function onFormatSelected(format: string) {
  showFormatDialog.value = false
  await stopRecording(format)
}
</script>

<template>
  <div class="recorder-view">
    <!-- 倒计时遮罩 -->
    <CountdownOverlay v-if="showCountdown" :seconds="3" @complete="onCountdownComplete" />

    <!-- 格式选择对话框 -->
    <div v-if="showFormatDialog" class="format-dialog-overlay" @click="showFormatDialog = false">
      <div class="format-dialog" @click.stop>
        <h3>选择保存格式</h3>
        <div class="format-options">
          <button
            v-for="fmt in outputFormats"
            :key="fmt"
            class="format-btn"
            @click="onFormatSelected(fmt)"
          >
            .{{ fmt }}
          </button>
        </div>
      </div>
    </div>

    <!-- 录制控制条 -->
    <RecordControls
      v-if="isRecording"
      :duration="formattedDuration"
      :is-paused="isPaused"
      @pause="pauseRecording"
      @resume="resumeRecording"
      @stop="handleStopRecording"
    />

    <div v-else class="recorder-content">
      <!-- 模式切换标签 -->
      <div class="mode-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="mode-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" :size="16" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- 模式内容区 -->
      <div class="mode-content">
        <!-- 窗口录制 -->
        <div v-if="activeTab === 'window'" class="mode-panel window-mode-panel">
          <div v-if="sourcesLoading" class="loading-text">正在获取窗口列表...</div>
          <div v-else-if="windowSources.length === 0" class="placeholder-card">
            <Monitor :size="48" class="placeholder-icon" />
            <h3>窗口录制</h3>
            <p>未检测到可录制的窗口</p>
          </div>
          <template v-else>
            <!-- 实时预览区域 -->
            <div v-if="livePreviewStream" class="live-preview-panel">
              <video
                ref="livePreviewVideoRef"
                class="live-preview-video"
                autoplay
                muted
                playsinline
              />
              <div class="live-preview-label">
                <Monitor :size="12" />
                <span>实时预览</span>
              </div>
            </div>
            <div v-else-if="selectedSourceId" class="live-preview-panel live-preview-loading">
              <Monitor :size="32" class="placeholder-icon" />
              <span>正在加载实时预览...</span>
            </div>
            <!-- 窗口选择网格 -->
            <div class="window-sources-grid">
              <div
                v-for="source in windowSources"
                :key="source.id"
                class="window-source-item"
                :class="{ selected: selectedSourceId === source.id }"
                @click="selectedSourceId = source.id"
              >
                <img :src="source.thumbnailDataUrl" :alt="source.name" class="window-thumbnail" />
                <span class="window-name">{{ source.name }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 区域录制 -->
        <div v-else-if="activeTab === 'area'" class="mode-panel">
          <div class="placeholder-card">
            <Square :size="48" class="placeholder-icon" />
            <h3>区域录制</h3>
            <p>点击开始录制，将进入区域选择模式</p>
            <p class="hint">可自由拖动选择区域，支持预设尺寸</p>
          </div>
        </div>

        <!-- 音频录制 -->
        <div v-else-if="activeTab === 'audio'" class="mode-panel">
          <div class="placeholder-card">
            <Mic :size="48" class="placeholder-icon" />
            <h3>音频录制</h3>
            <p>纯音频录制模式，可选择输入设备</p>
          </div>
        </div>
      </div>

      <!-- 设备选择区 -->
      <div class="device-section">
        <h4 class="section-title">
          <Headphones :size="14" />
          设备选择
        </h4>
        <div class="device-grid">
          <!-- 麦克风 -->
          <div class="device-field">
            <label class="device-label">
              <Mic :size="12" />
              麦克风
            </label>
            <select v-model="selectedMicrophone" class="device-select" :disabled="devicesLoading">
              <option value="">系统默认</option>
              <option value="none">不使用</option>
              <option v-for="mic in microphones" :key="mic.deviceId" :value="mic.deviceId">
                {{ mic.label || `麦克风 ${mic.deviceId.slice(0, 8)}` }}
              </option>
            </select>
          </div>

          <!-- 扬声器 -->
          <div class="device-field">
            <label class="device-label">
              <Headphones :size="12" />
              扬声器
            </label>
            <select v-model="selectedSpeaker" class="device-select" :disabled="devicesLoading">
              <option value="">系统默认</option>
              <option value="none">不使用</option>
              <option v-for="spk in speakers" :key="spk.deviceId" :value="spk.deviceId">
                {{ spk.label || `扬声器 ${spk.deviceId.slice(0, 8)}` }}
              </option>
            </select>
          </div>

          <!-- 摄像头 -->
          <div class="device-field">
            <label class="device-label">
              <Video :size="12" />
              摄像头
            </label>
            <select v-model="selectedCamera" class="device-select" :disabled="devicesLoading">
              <option value="">不启用</option>
              <option v-for="cam in cameras" :key="cam.deviceId" :value="cam.deviceId">
                {{ cam.label || `摄像头 ${cam.deviceId.slice(0, 8)}` }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 开始录制按钮 -->
      <button class="start-record-btn" @click="handleStartRecording">
        <Circle :size="20" class="record-dot" />
        <span>开始录制</span>
      </button>

      <!-- 底部导航 -->
      <div class="bottom-nav">
        <router-link to="/records" class="bottom-link">
          <Film :size="16" />
          <span>录制列表</span>
        </router-link>
        <router-link to="/settings" class="bottom-link">
          <Settings :size="16" />
          <span>设置</span>
        </router-link>
      </div>
    </div>

    <!-- 录制预览区域（录制时显示） -->
    <div v-if="isRecording" class="recording-preview">
      <video ref="videoRef" class="preview-video" autoplay muted playsinline />
      <div class="preview-label">
        <Monitor :size="14" />
        <span>录制预览</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recorder-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.recorder-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 20px;
  overflow-y: auto;
}

/* 模式切换标签 */
.mode-tabs {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: var(--glass-low);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-tab:hover {
  color: var(--text-primary);
  background: var(--glass-mid);
}

.mode-tab.active {
  color: var(--accent);
  background: var(--bg-accent);
  box-shadow: 0 0 12px var(--accent-glow);
}

/* 模式内容区 */
.mode-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
}

.mode-panel {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.placeholder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 32px;
  background: var(--glass-low);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  text-align: center;
}

.placeholder-icon {
  color: var(--accent);
  opacity: 0.7;
}

.placeholder-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.placeholder-card p {
  font-size: 13px;
  color: var(--text-secondary);
}

.placeholder-card .hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* 窗口录制模式 */
.window-mode-panel {
  flex-direction: column;
  gap: 12px;
  padding: 8px;
}

/* 实时预览 */
.live-preview-panel {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #000;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  overflow: hidden;
  position: relative;
}

.live-preview-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.live-preview-label {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  color: #22c55e;
  font-size: 11px;
  font-weight: 600;
}

.live-preview-label span {
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.live-preview-loading {
  background: var(--glass-low);
  color: var(--text-secondary);
  font-size: 13px;
  gap: 12px;
}

/* 窗口源列表 */
.loading-text {
  color: var(--text-secondary);
  font-size: 14px;
}

.window-sources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  width: 100%;
  padding: 8px;
  overflow-y: auto;
  max-height: 140px;
  flex-shrink: 0;
}

.window-source-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: var(--glass-low);
  cursor: pointer;
  transition: all 0.2s ease;
}

.window-source-item:hover {
  background: var(--glass-mid);
}

.window-source-item.selected {
  border-color: var(--accent);
  background: var(--bg-accent);
  box-shadow: 0 0 12px var(--accent-glow);
}

.window-thumbnail {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 8px;
  background: var(--glass-mid);
}

.window-name {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.window-source-item.selected .window-name {
  color: var(--accent);
}

/* 设备选择区 */
.device-section {
  padding: 16px;
  background: var(--glass-low);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.device-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.device-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
}

.device-select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--glass-mid);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.device-select:hover {
  border-color: var(--glass-highlight);
}

.device-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.device-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.device-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* 开始录制按钮 */
.start-record-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-active) 100%);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
}

.start-record-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 28px rgba(139, 92, 246, 0.4);
}

.start-record-btn:active {
  transform: translateY(0);
}

.record-dot {
  fill: #ef4444;
  color: #ef4444;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 底部导航 */
.bottom-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding-top: 8px;
}

.bottom-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.bottom-link:hover {
  color: var(--text-secondary);
  background: var(--glass-mid);
}

/* 录制预览 */
.recording-preview {
  position: absolute;
  top: 60px;
  left: 20px;
  right: 20px;
  bottom: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  overflow: hidden;
}

.preview-video {
  width: 100%;
  height: calc(100% - 32px);
  object-fit: contain;
  background: #000;
}

.preview-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
}

/* 格式选择对话框 */
.format-dialog-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  backdrop-filter: blur(4px);
}

.format-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 28px 36px;
  background: var(--glass-low);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  backdrop-filter: blur(24px);
}

.format-dialog h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.format-options {
  display: flex;
  gap: 12px;
}

.format-btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: var(--glass-mid);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.format-btn:hover {
  border-color: var(--accent);
  background: var(--bg-accent);
  color: var(--accent);
}
</style>

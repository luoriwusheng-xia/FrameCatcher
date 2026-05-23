<script setup lang="ts">
import { ref } from 'vue'
import { Monitor, Square, Mic, Headphones, Video, Circle, Film, Settings } from 'lucide-vue-next'
import { useMediaDevices } from '../composables/useMediaDevices'
import { useRecorder, type RecordMode } from '../composables/useRecorder'
import RecordControls from '../components/recorder/RecordControls.vue'
import CountdownOverlay from '../components/recorder/CountdownOverlay.vue'

const { microphones, speakers, cameras, loading: devicesLoading } = useMediaDevices()
const {
  isRecording,
  isPaused,
  formattedDuration,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording
} = useRecorder()

const activeTab = ref<RecordMode>('window')
const selectedMicrophone = ref('')
const selectedSpeaker = ref('')
const selectedCamera = ref('')
const showCountdown = ref(false)

const tabs = [
  { key: 'window' as RecordMode, label: '窗口录制', icon: Monitor },
  { key: 'area' as RecordMode, label: '区域录制', icon: Square },
  { key: 'audio' as RecordMode, label: '音频录制', icon: Mic }
]

async function handleStartRecording() {
  showCountdown.value = true
}

async function onCountdownComplete() {
  showCountdown.value = false
  await startRecording(activeTab.value)
}

async function handleStopRecording() {
  await stopRecording()
}
</script>

<template>
  <div class="recorder-view">
    <!-- 倒计时遮罩 -->
    <CountdownOverlay v-if="showCountdown" :seconds="3" @complete="onCountdownComplete" />

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
        <div v-if="activeTab === 'window'" class="mode-panel">
          <div class="placeholder-card">
            <Monitor :size="48" class="placeholder-icon" />
            <h3>窗口录制</h3>
            <p>点击开始录制，系统将弹出窗口选择器</p>
          </div>
        </div>

        <!-- 区域录制 -->
        <div v-else-if="activeTab === 'area'" class="mode-panel">
          <div class="placeholder-card">
            <Square :size="48" class="placeholder-icon" />
            <h3>区域录制</h3>
            <p>点击开始录制，将进入区域选择模式</p>
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
}

.mode-panel {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>

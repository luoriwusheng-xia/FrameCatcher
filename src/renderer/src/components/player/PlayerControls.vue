<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Subtitles
} from 'lucide-vue-next'

dayjs.extend(duration)

const props = defineProps<{
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackRate: number
  isFullscreen: boolean
  subtitlesEnabled: boolean
  show: boolean
}>()

const emit = defineEmits<{
  togglePlay: []
  skipBackward: []
  skipForward: []
  seek: [time: number]
  seekStart: []
  seekEnd: [time: number]
  setVolume: [volume: number]
  toggleMute: []
  setPlaybackRate: [rate: number]
  toggleFullscreen: []
  toggleSubtitles: []
}>()

const isDragging = ref(false)
const dragValue = ref(0)
const showSpeedMenu = ref(false)

const speedOptions = [0.5, 1, 1.25, 1.5, 2]

const progressPercent = computed(() => {
  if (props.duration <= 0) return 0
  const time = isDragging.value ? dragValue.value : props.currentTime
  return (time / props.duration) * 100
})

const displayTime = computed(() => {
  const time = isDragging.value ? dragValue.value : props.currentTime
  return formatTime(time)
})

const totalTime = computed(() => formatTime(props.duration))

function formatTime(seconds: number): string {
  const d = dayjs.duration(Math.floor(seconds || 0), 'seconds')
  const h = d.hours()
  const m = d.minutes().toString().padStart(2, '0')
  const s = d.seconds().toString().padStart(2, '0')
  if (h > 0) return `${h}:${m}:${s}`
  return `${m}:${s}`
}

function onProgressBarClick(event: MouseEvent) {
  const bar = event.currentTarget as HTMLElement
  const rect = bar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const time = percent * props.duration
  emit('seek', time)
}

function onProgressMouseDown(event: MouseEvent) {
  isDragging.value = true
  dragValue.value = props.currentTime
  emit('seekStart')
  updateDragValue(event)

  const onMouseMove = (e: MouseEvent) => {
    updateDragValue(e)
  }

  const onMouseUp = (e: MouseEvent) => {
    updateDragValue(e)
    isDragging.value = false
    emit('seekEnd', dragValue.value)
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function updateDragValue(event: MouseEvent) {
  const bar = (event.currentTarget as HTMLElement) || document.querySelector('.progress-bar')
  if (!bar) return
  const rect = bar.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  dragValue.value = percent * props.duration
}

function onVolumeChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('setVolume', parseFloat(target.value))
}

function selectSpeed(rate: number) {
  emit('setPlaybackRate', rate)
  showSpeedMenu.value = false
}

function onVolumeWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -0.05 : 0.05
  const newVolume = Math.max(0, Math.min(1, props.volume + delta))
  emit('setVolume', Math.round(newVolume * 100) / 100)
}
</script>

<template>
  <div class="controls-overlay" :class="{ hidden: !show }">
    <div class="progress-section" @click="onProgressBarClick">
      <div class="progress-bar" @mousedown.stop="onProgressMouseDown">
        <div class="progress-track"></div>
        <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        <div class="progress-thumb" :style="{ left: `${progressPercent}%` }"></div>
      </div>
    </div>

    <div class="controls-row">
      <div class="controls-left">
        <button class="control-btn" @click="emit('togglePlay')" title="播放/暂停">
          <Play v-if="!isPlaying" :size="20" />
          <Pause v-else :size="20" />
        </button>

        <button class="control-btn" @click="emit('skipBackward')" title="后退 5 秒">
          <RotateCcw :size="18" />
        </button>

        <button class="control-btn" @click="emit('skipForward')" title="前进 5 秒">
          <RotateCw :size="18" />
        </button>

        <span class="time-display">{{ displayTime }} / {{ totalTime }}</span>
      </div>

      <div class="controls-right">
        <div class="speed-selector">
          <button class="control-btn speed-btn" @click="showSpeedMenu = !showSpeedMenu">
            {{ playbackRate }}x
          </button>
          <div v-if="showSpeedMenu" class="speed-menu">
            <button
              v-for="rate in speedOptions"
              :key="rate"
              class="speed-option"
              :class="{ active: playbackRate === rate }"
              @click="selectSpeed(rate)"
            >
              {{ rate }}x
            </button>
          </div>
        </div>

        <button
          class="control-btn"
          :class="{ active: subtitlesEnabled }"
          @click="emit('toggleSubtitles')"
          title="字幕开关"
        >
          <Subtitles :size="18" />
        </button>

        <div class="volume-control">
          <button class="control-btn" @click="emit('toggleMute')" title="静音">
            <VolumeX v-if="isMuted || volume === 0" :size="18" />
            <Volume2 v-else :size="18" />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="isMuted ? 0 : volume"
            @input="onVolumeChange"
            @wheel="onVolumeWheel"
            class="volume-slider"
          />
        </div>

        <button class="control-btn" @click="emit('toggleFullscreen')" title="全屏">
          <Maximize v-if="!isFullscreen" :size="18" />
          <Minimize v-else :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.controls-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 16px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 60%, transparent 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: 1;
  transform: translateY(0);
  z-index: 10;
}

.controls-overlay.hidden {
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
}

.progress-section {
  padding: 8px 0 6px;
  cursor: pointer;
}

.progress-bar {
  position: relative;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: height 0.2s ease;
}

.progress-bar:hover {
  height: 6px;
}

.progress-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.1);
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid #fff;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.2s ease;
  box-shadow: 0 0 8px var(--accent-glow);
}

.progress-bar:hover .progress-thumb,
.progress-bar:active .progress-thumb {
  transform: translate(-50%, -50%) scale(1);
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: var(--glass-mid);
  color: var(--accent);
}

.control-btn.active {
  color: var(--accent);
  background: var(--glass-mid);
}

.time-display {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: 8px;
  font-variant-numeric: tabular-nums;
  user-select: none;
}

.speed-selector {
  position: relative;
}

.speed-btn {
  width: auto;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 500;
}

.speed-menu {
  position: absolute;
  bottom: 44px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 72px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.speed-option {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.speed-option:hover {
  background: var(--glass-mid);
  color: var(--text-primary);
}

.speed-option.active {
  background: var(--accent);
  color: #fff;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid #fff;
  cursor: pointer;
  box-shadow: 0 0 6px var(--accent-glow);
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid #fff;
  cursor: pointer;
  box-shadow: 0 0 6px var(--accent-glow);
}
</style>

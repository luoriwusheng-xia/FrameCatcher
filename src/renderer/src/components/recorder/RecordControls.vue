<script setup lang="ts">
import { Pause, Play, Square } from 'lucide-vue-next'

defineProps<{
  duration: string
  isPaused: boolean
}>()

const emit = defineEmits<{
  pause: []
  resume: []
  stop: []
}>()

function handleTogglePause() {
  emit('pause')
}

function handleToggleResume() {
  emit('resume')
}

function handleStop() {
  emit('stop')
}
</script>

<template>
  <div class="record-controls">
    <div class="controls-inner">
      <!-- 录制指示灯 -->
      <div class="record-indicator">
        <div class="indicator-dot" />
        <span class="indicator-label">REC</span>
      </div>

      <!-- 录制时长 -->
      <div class="duration-display">
        {{ duration }}
      </div>

      <!-- 控制按钮 -->
      <div class="control-buttons">
        <button
          v-if="!isPaused"
          class="control-btn pause-btn"
          title="暂停录制"
          @click="handleTogglePause"
        >
          <Pause :size="18" />
        </button>
        <button
          v-else
          class="control-btn resume-btn"
          title="继续录制"
          @click="handleToggleResume"
        >
          <Play :size="18" />
        </button>

        <button class="control-btn stop-btn" title="停止录制" @click="handleStop">
          <Square :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.record-controls {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.controls-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  background: var(--glass-low);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* 录制指示灯 */
.record-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
  animation: blink 1.2s ease-in-out infinite;
}

.indicator-label {
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  letter-spacing: 1px;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
  }
  50% {
    opacity: 0.3;
    box-shadow: 0 0 2px rgba(239, 68, 68, 0.2);
  }
}

/* 时长显示 */
.duration-display {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 1px;
  min-width: 80px;
  text-align: center;
}

/* 控制按钮 */
.control-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: var(--glass-mid);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: var(--glass-high);
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}

.pause-btn:hover {
  color: #f59e0b;
}

.resume-btn:hover {
  color: var(--accent);
}

.stop-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}
</style>

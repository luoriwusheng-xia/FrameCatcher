<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Pause, Play, Square, GripVertical } from 'lucide-vue-next'

defineProps<{
  duration: string
  isPaused: boolean
}>()

const emit = defineEmits<{
  pause: []
  resume: []
  stop: []
}>()

const controlsRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const position = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

function handleMouseDown(e: MouseEvent) {
  // 只有点击控制条本身（不是按钮）时才拖动
  const target = e.target as HTMLElement
  if (target.closest('.control-btn')) return

  isDragging.value = true
  const rect = controlsRef.value?.getBoundingClientRect()
  if (rect) {
    dragOffset.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  position.value = {
    x: e.clientX - dragOffset.value.x,
    y: e.clientY - dragOffset.value.y,
  }
}

function handleMouseUp() {
  isDragging.value = false
}

function handleTogglePause() {
  emit('pause')
}

function handleToggleResume() {
  emit('resume')
}

function handleStop() {
  emit('stop')
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div
    ref="controlsRef"
    class="record-controls"
    :class="{ dragging: isDragging }"
    :style="{
      left: position.x > 0 ? position.x + 'px' : '50%',
      top: position.y > 0 ? position.y + 'px' : 'auto',
      bottom: position.y > 0 ? 'auto' : '32px',
      transform: position.x > 0 ? 'none' : 'translateX(-50%)',
    }"
    @mousedown="handleMouseDown"
  >
    <div class="controls-inner">
      <!-- 拖动手柄 -->
      <div class="drag-handle" title="拖动">
        <GripVertical :size="14" />
      </div>

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
  position: fixed;
  z-index: 100;
  cursor: grab;
  user-select: none;
}

.record-controls.dragging {
  cursor: grabbing;
}

.controls-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--glass-low);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* 拖动手柄 */
.drag-handle {
  display: flex;
  align-items: center;
  color: var(--text-muted);
  cursor: grab;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s;
}

.drag-handle:hover {
  color: var(--text-secondary);
  background: var(--glass-mid);
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

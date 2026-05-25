<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface PresetSize {
  label: string
  width: number
  height: number
}

const presets: PresetSize[] = [
  { label: '1920 x 1080', width: 1920, height: 1080 },
  { label: '1280 x 720', width: 1280, height: 720 },
  { label: '800 x 600', width: 800, height: 600 },
  { label: '400 x 400', width: 400, height: 400 },
]

const rect = ref({ x: 100, y: 100, width: 800, height: 600 })
const isDragging = ref(false)
const isResizing = ref(false)
const dragStart = ref({ x: 0, y: 0, rectX: 0, rectY: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, corner: '' })
const selectedPreset = ref('')

const containerRef = ref<HTMLDivElement | null>(null)

const screenWidth = ref(window.innerWidth)
const screenHeight = ref(window.innerHeight)

function updateScreenSize() {
  screenWidth.value = window.innerWidth
  screenHeight.value = window.innerHeight
}

function onPresetChange() {
  const preset = presets.find((p) => p.label === selectedPreset.value)
  if (preset) {
    rect.value.width = preset.width
    rect.value.height = preset.height
    clampRect()
  }
}

function clampRect() {
  const maxW = screenWidth.value
  const maxH = screenHeight.value
  rect.value.x = Math.max(0, Math.min(rect.value.x, maxW - rect.value.width))
  rect.value.y = Math.max(0, Math.min(rect.value.y, maxH - rect.value.height))
  rect.value.width = Math.min(rect.value.width, maxW - rect.value.x)
  rect.value.height = Math.min(rect.value.height, maxH - rect.value.y)
  rect.value.width = Math.max(100, rect.value.width)
  rect.value.height = Math.max(100, rect.value.height)
}

function onOverlayMouseDown(e: MouseEvent) {
  if (e.target === containerRef.value) {
    rect.value.x = e.clientX - rect.value.width / 2
    rect.value.y = e.clientY - rect.value.height / 2
    clampRect()
    isDragging.value = true
    dragStart.value = { x: e.clientX, y: e.clientY, rectX: rect.value.x, rectY: rect.value.y }
  }
}

function onRectMouseDown(e: MouseEvent) {
  e.stopPropagation()
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY, rectX: rect.value.x, rectY: rect.value.y }
}

function onCornerMouseDown(e: MouseEvent, corner: string) {
  e.stopPropagation()
  isResizing.value = true
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    width: rect.value.width,
    height: rect.value.height,
    corner,
  }
}

function onMouseMove(e: MouseEvent) {
  if (isDragging.value) {
    const dx = e.clientX - dragStart.value.x
    const dy = e.clientY - dragStart.value.y
    rect.value.x = dragStart.value.rectX + dx
    rect.value.y = dragStart.value.rectY + dy
    clampRect()
  }
  if (isResizing.value) {
    const dx = e.clientX - resizeStart.value.x
    const dy = e.clientY - resizeStart.value.y
    const corner = resizeStart.value.corner

    if (corner.includes('e')) {
      rect.value.width = Math.max(100, resizeStart.value.width + dx)
    }
    if (corner.includes('w')) {
      const newWidth = Math.max(100, resizeStart.value.width - dx)
      const delta = rect.value.width - newWidth
      rect.value.width = newWidth
      rect.value.x += delta
    }
    if (corner.includes('s')) {
      rect.value.height = Math.max(100, resizeStart.value.height + dy)
    }
    if (corner.includes('n')) {
      const newHeight = Math.max(100, resizeStart.value.height - dy)
      const delta = rect.value.height - newHeight
      rect.value.height = newHeight
      rect.value.y += delta
    }
    clampRect()
  }
}

function onMouseUp() {
  isDragging.value = false
  isResizing.value = false
}

function getCornerStyle(corner: string) {
  const base = {
    position: 'absolute' as const,
    width: '12px',
    height: '12px',
    background: '#fff',
    borderRadius: '2px',
    zIndex: 10,
  }
  if (corner === 'nw') return { ...base, top: '-6px', left: '-6px', cursor: 'nw-resize' }
  if (corner === 'ne') return { ...base, top: '-6px', right: '-6px', cursor: 'ne-resize' }
  if (corner === 'sw') return { ...base, bottom: '-6px', left: '-6px', cursor: 'sw-resize' }
  if (corner === 'se') return { ...base, bottom: '-6px', right: '-6px', cursor: 'se-resize' }
  return base
}

function handleConfirm() {
  window.api.areaSelector.confirm({
    x: Math.round(rect.value.x),
    y: Math.round(rect.value.y),
    width: Math.round(rect.value.width),
    height: Math.round(rect.value.height),
  })
}

function handleCancel() {
  window.api.areaSelector.cancel()
}

onMounted(() => {
  window.addEventListener('resize', updateScreenSize)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  clampRect()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <div ref="containerRef" class="area-selector-overlay" @mousedown="onOverlayMouseDown">
    <!-- 选择区域 -->
    <div
      class="selection-rect"
      :style="{
        left: rect.x + 'px',
        top: rect.y + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
      }"
      @mousedown="onRectMouseDown"
    >
      <!-- 尺寸信息 -->
      <div class="size-label">
        {{ rect.width }} x {{ rect.height }}
      </div>

      <!-- 四个角拖拽手柄 -->
      <div
        v-for="corner in ['nw', 'ne', 'sw', 'se']"
        :key="corner"
        :style="getCornerStyle(corner)"
        @mousedown="(e) => onCornerMouseDown(e, corner)"
      />
    </div>

    <!-- 底部控制栏 -->
    <div class="selector-controls">
      <div class="controls-row">
        <div class="input-group">
          <label>宽</label>
          <input v-model.number="rect.width" type="number" min="100" @change="clampRect" />
        </div>
        <span class="input-sep">x</span>
        <div class="input-group">
          <label>高</label>
          <input v-model.number="rect.height" type="number" min="100" @change="clampRect" />
        </div>
        <select v-model="selectedPreset" class="preset-select" @change="onPresetChange">
          <option value="">自定义</option>
          <option v-for="preset in presets" :key="preset.label" :value="preset.label">
            {{ preset.label }}
          </option>
        </select>
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button class="btn-confirm" @click="handleConfirm">开始录制</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.area-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  cursor: crosshair;
  user-select: none;
}

.selection-rect {
  position: fixed;
  border: 2px dashed #fff;
  background: transparent;
  cursor: move;
}

.size-label {
  position: absolute;
  top: -28px;
  left: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
}

.selector-controls {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px 24px;
  backdrop-filter: blur(16px);
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-group label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.input-group input {
  width: 70px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 13px;
  outline: none;
}

.input-group input:focus {
  border-color: #8b5cf6;
}

.input-sep {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.preset-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.preset-select option {
  background: #1a1a2e;
  color: #fff;
}

.btn-cancel {
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-confirm {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>

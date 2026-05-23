<script setup lang="ts">
import { computed } from 'vue'
import { Type, Image } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settings'

const store = useSettingsStore()

const enabled = computed({
  get: () => store.settings.watermark.enabled,
  set: (val: boolean) => {
    store.settings.watermark.setEnabled(val)
    store.saveSection('watermark', { enabled: val })
  }
})

const watermarkType = computed({
  get: () => store.settings.watermark.type,
  set: (val: 'none' | 'text' | 'image') => {
    store.settings.watermark.setType(val)
    store.saveSection('watermark', { type: val })
  }
})

const text = computed({
  get: () => store.settings.watermark.text,
  set: (val: string) => {
    store.settings.watermark.setText(val)
    store.saveSection('watermark', { text: val })
  }
})

const textColor = computed({
  get: () => store.settings.watermark.textColor,
  set: (val: string) => {
    store.settings.watermark.setTextColor(val)
    store.saveSection('watermark', { textColor: val })
  }
})

const fontSize = computed({
  get: () => store.settings.watermark.fontSize,
  set: (val: number) => {
    store.settings.watermark.setFontSize(val)
    store.saveSection('watermark', { fontSize: val })
  }
})

const density = computed({
  get: () => store.settings.watermark.density,
  set: (val: 'low' | 'medium' | 'high') => {
    store.settings.watermark.setDensity(val)
    store.saveSection('watermark', { density: val })
  }
})

const imagePath = computed({
  get: () => store.settings.watermark.imagePath,
  set: (val: string) => {
    store.settings.watermark.setImagePath(val)
    store.saveSection('watermark', { imagePath: val })
  }
})

const imageOpacity = computed({
  get: () => store.settings.watermark.imageOpacity,
  set: (val: number) => {
    store.settings.watermark.setImageOpacity(val)
    store.saveSection('watermark', { imageOpacity: val })
  }
})

const textLength = computed(() => text.value.length)

function handleImageBrowse() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    if (input.files && input.files.length > 0) {
      const path = input.files[0].path
      if (path) imagePath.value = path
    }
  }
  input.click()
}
</script>

<template>
  <div class="settings-section">
    <h2 class="section-title">水印设置</h2>

    <!-- 水印开关 -->
    <div class="setting-item">
      <div class="setting-label">
        <label>启用水印</label>
      </div>
      <div class="setting-control">
        <button
          class="toggle-switch"
          :class="{ active: enabled }"
          @click="enabled = !enabled"
        >
          <span class="toggle-thumb" />
        </button>
      </div>
    </div>

    <!-- 水印类型（仅启用时显示） -->
    <Transition name="fade">
      <div v-if="enabled" class="setting-item">
        <div class="setting-label">
          <label>水印类型</label>
        </div>
        <div class="setting-control">
          <div class="type-tabs">
            <button
              class="type-tab"
              :class="{ active: watermarkType === 'none' }"
              @click="watermarkType = 'none'"
            >
              不添加
            </button>
            <button
              class="type-tab"
              :class="{ active: watermarkType === 'text' }"
              @click="watermarkType = 'text'"
            >
              <Type :size="14" />
              文字
            </button>
            <button
              class="type-tab"
              :class="{ active: watermarkType === 'image' }"
              @click="watermarkType = 'image'"
            >
              <Image :size="14" />
              图片
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 文字水印配置 -->
    <Transition name="fade">
      <div v-if="enabled && watermarkType === 'text'" class="sub-settings">
        <!-- 文字内容 -->
        <div class="setting-item">
          <div class="setting-label">
            <label>文字内容</label>
          </div>
          <div class="setting-control">
            <div class="text-input-wrapper">
              <input
                v-model="text"
                type="text"
                class="glass-input"
                placeholder="输入水印文字..."
                maxlength="30"
              />
              <span class="char-count">{{ textLength }}/30</span>
            </div>
          </div>
        </div>

        <!-- 文字颜色 -->
        <div class="setting-item">
          <div class="setting-label">
            <label>文字颜色</label>
          </div>
          <div class="setting-control">
            <div class="color-picker-wrapper">
              <input
                v-model="textColor"
                type="color"
                class="color-picker"
              />
              <span class="color-value">{{ textColor }}</span>
            </div>
          </div>
        </div>

        <!-- 字体大小 -->
        <div class="setting-item">
          <div class="setting-label">
            <label>字体大小</label>
          </div>
          <div class="setting-control slider-control">
            <input
              v-model.number="fontSize"
              type="range"
              min="12"
              max="72"
              class="glass-slider"
            />
            <span class="slider-value">{{ fontSize }}px</span>
          </div>
        </div>

        <!-- 密集程度 -->
        <div class="setting-item">
          <div class="setting-label">
            <label>密集程度</label>
          </div>
          <div class="setting-control">
            <select v-model="density" class="glass-select">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 图片水印配置 -->
    <Transition name="fade">
      <div v-if="enabled && watermarkType === 'image'" class="sub-settings">
        <!-- 图片文件 -->
        <div class="setting-item">
          <div class="setting-label">
            <label>图片文件</label>
          </div>
          <div class="setting-control path-control">
            <input
              :value="imagePath"
              type="text"
              class="glass-input path-input"
              placeholder="选择图片文件..."
              readonly
            />
            <button class="glass-btn browse-btn" @click="handleImageBrowse">
              <Image :size="16" />
              <span>选择</span>
            </button>
          </div>
        </div>

        <!-- 透明度 -->
        <div class="setting-item">
          <div class="setting-label">
            <label>透明度</label>
          </div>
          <div class="setting-control slider-control">
            <input
              v-model.number="imageOpacity"
              type="range"
              min="0"
              max="100"
              class="glass-slider"
            />
            <span class="slider-value">{{ imageOpacity }}%</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-section {
  padding: 8px 0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 28px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.sub-settings {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  margin-top: 4px;
}

.sub-settings .setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.setting-control {
  display: flex;
  align-items: center;
}

/* Toggle Switch */
.toggle-switch {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.toggle-switch.active {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-color: transparent;
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.3);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(22px);
}

/* Type Tabs */
.type-tabs {
  display: flex;
  gap: 8px;
}

.type-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-tab:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.type-tab.active {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

/* Text Input */
.glass-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 14px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.glass-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
}

.text-input-wrapper {
  position: relative;
  width: 100%;
}

.text-input-wrapper .glass-input {
  padding-right: 56px;
}

.char-count {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

/* Color Picker */
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: none;
  cursor: pointer;
  padding: 2px;
  overflow: hidden;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 8px;
}

.color-value {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  font-family: monospace;
  text-transform: uppercase;
}

/* Slider */
.slider-control {
  display: flex;
  align-items: center;
  gap: 14px;
}

.glass-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.glass-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 2px 10px rgba(139, 92, 246, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.glass-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 14px rgba(139, 92, 246, 0.5);
}

.glass-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 2px 10px rgba(139, 92, 246, 0.4);
  cursor: pointer;
  border: none;
}

.slider-value {
  min-width: 48px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #a78bfa;
}

/* Select */
.glass-select {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 14px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.glass-select:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
}

.glass-select option {
  background: #1b1b1f;
  color: rgba(255, 255, 255, 0.9);
}

/* Path control */
.path-control {
  gap: 10px;
}

.path-input {
  cursor: default;
}

.glass-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.glass-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

.browse-btn {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border: none;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
}

.browse-btn:hover {
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  box-shadow: 0 4px 24px rgba(139, 92, 246, 0.4);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

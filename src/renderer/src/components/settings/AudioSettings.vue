<script setup lang="ts">
import { computed } from 'vue'
import { Mic, Monitor } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settings'

const store = useSettingsStore()

const defaultMic = computed({
  get: () => store.settings.audio.defaultMic,
  set: (val: string) => {
    store.settings.audio.setDefaultMic(val)
    store.saveSection('audio', { defaultMic: val })
  }
})

const defaultSpeaker = computed({
  get: () => store.settings.audio.defaultSpeaker,
  set: (val: string) => {
    store.settings.audio.setDefaultSpeaker(val)
    store.saveSection('audio', { defaultSpeaker: val })
  }
})

const micVolume = computed({
  get: () => store.settings.audio.micVolume,
  set: (val: number) => {
    store.settings.audio.setMicVolume(val)
    store.saveSection('audio', { micVolume: val })
  }
})

const speakerVolume = computed({
  get: () => store.settings.audio.speakerVolume,
  set: (val: number) => {
    store.settings.audio.setSpeakerVolume(val)
    store.saveSection('audio', { speakerVolume: val })
  }
})
</script>

<template>
  <div class="settings-section">
    <h2 class="section-title">音频设置</h2>

    <!-- 默认麦克风 -->
    <div class="setting-item">
      <div class="setting-label">
        <label>
          <Mic :size="14" />
          默认麦克风
        </label>
      </div>
      <div class="setting-control">
        <select v-model="defaultMic" class="glass-select">
          <option value="default">默认麦克风</option>
          <option value="none">不使用麦克风</option>
        </select>
      </div>
    </div>

    <!-- 默认扬声器 -->
    <div class="setting-item">
      <div class="setting-label">
        <label>
          <Monitor :size="14" />
          默认扬声器
        </label>
      </div>
      <div class="setting-control">
        <select v-model="defaultSpeaker" class="glass-select">
          <option value="default">默认扬声器</option>
          <option value="none">不使用扬声器</option>
        </select>
      </div>
    </div>

    <!-- 麦克风音量 -->
    <div class="setting-item">
      <div class="setting-label">
        <label>麦克风音量</label>
      </div>
      <div class="setting-control slider-control">
        <input
          v-model.number="micVolume"
          type="range"
          min="0"
          max="100"
          class="glass-slider"
        />
        <span class="slider-value">{{ micVolume }}</span>
      </div>
    </div>

    <!-- 扬声器音量 -->
    <div class="setting-item">
      <div class="setting-label">
        <label>扬声器音量</label>
      </div>
      <div class="setting-control slider-control">
        <input
          v-model.number="speakerVolume"
          type="range"
          min="0"
          max="100"
          class="glass-slider"
        />
        <span class="slider-value">{{ speakerVolume }}</span>
      </div>
    </div>
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
  margin-bottom: 24px;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.setting-control {
  display: flex;
  align-items: center;
}

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
  min-width: 32px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #a78bfa;
}
</style>

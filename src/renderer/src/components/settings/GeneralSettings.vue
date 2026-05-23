<script setup lang="ts">
import { computed } from 'vue'
import { FolderOpen } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settings'

const store = useSettingsStore()

const outputDir = computed({
  get: () => store.settings.general.outputDir,
  set: (val: string) => {
    store.settings.general.setOutputDir(val)
    store.saveSection('general', { outputDir: val })
  }
})

function handleBrowse() {
  const input = document.createElement('input')
  input.type = 'file'
  input.webkitdirectory = true
  input.onchange = () => {
    if (input.files && input.files.length > 0) {
      const path = input.files[0].path
      if (path) {
        const dir = path.substring(0, path.lastIndexOf('\\'))
        outputDir.value = dir
      }
    }
  }
  input.click()
}
</script>

<template>
  <div class="settings-section">
    <h2 class="section-title">常规设置</h2>

    <div class="setting-item">
      <div class="setting-label">
        <label>视频保存路径</label>
        <span class="setting-hint">录制文件将保存在此目录</span>
      </div>
      <div class="setting-control path-control">
        <input
          :value="outputDir"
          type="text"
          class="glass-input path-input"
          placeholder="选择保存目录..."
          readonly
        />
        <button class="glass-btn browse-btn" @click="handleBrowse">
          <FolderOpen :size="16" />
          <span>浏览</span>
        </button>
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
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.setting-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

.setting-control {
  display: flex;
  align-items: center;
}

.path-control {
  gap: 10px;
}

.glass-input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 14px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  flex: 1;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.glass-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
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
</style>

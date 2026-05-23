<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import {
  Settings,
  SlidersHorizontal,
  Volume2,
  Palette
} from 'lucide-vue-next'
import GeneralSettings from '../components/settings/GeneralSettings.vue'
import AudioSettings from '../components/settings/AudioSettings.vue'
import WatermarkSettings from '../components/settings/WatermarkSettings.vue'

type TabKey = 'general' | 'audio' | 'watermark'

interface TabItem {
  key: TabKey
  label: string
  icon: typeof Settings
  component: typeof GeneralSettings
}

const tabs: TabItem[] = [
  { key: 'general', label: '常规设置', icon: SlidersHorizontal, component: GeneralSettings },
  { key: 'audio', label: '音频设置', icon: Volume2, component: AudioSettings },
  { key: 'watermark', label: '水印设置', icon: Palette, component: WatermarkSettings }
]

const activeTab = ref<TabKey>('general')
const currentComponent = shallowRef(GeneralSettings)

function switchTab(tab: TabItem) {
  activeTab.value = tab.key
  currentComponent.value = tab.component
}
</script>

<template>
  <div class="settings-view">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <Settings :size="22" />
        <span>设置</span>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="nav-item"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab)"
        >
          <component :is="tab.icon" :size="18" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- 内容区 -->
    <main class="content">
      <Transition name="fade" mode="out-in">
        <component :is="currentComponent" :key="activeTab" />
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  width: 100%;
  height: 100%;
  background: transparent;
}

/* 侧边栏 */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: rgba(18, 18, 26, 0.8);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px 20px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  font-weight: 600;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  text-align: left;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.active {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

/* 内容区 */
.content {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
}

/* 切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Monitor, Film, Settings, Minus, Square, X } from 'lucide-vue-next'
import { onMounted, onUnmounted } from 'vue'

const route = useRoute()
const router = useRouter()
const isMac = typeof process !== 'undefined' && process.platform === 'darwin'

function isActive(path: string): boolean {
  return route.path === path
}

function onClose(): void {
  window.electron.ipcRenderer.send('window:close')
}

function onMinimize(): void {
  window.electron.ipcRenderer.send('window:minimize')
}

function onMaximize(): void {
  window.electron.ipcRenderer.send('window:maximize')
}

onMounted(() => {
  const unsubscribe = window.electron.ipcRenderer.on('menu:navigate', (_, path: string) => {
    router.push(path)
  })

  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<template>
  <div class="app-root">
    <!-- 顶部标题栏 -->
    <header class="app-header">
      <div class="header-left">
        <div class="logo">
          <Monitor :size="22" />
          <span class="logo-text">FrameCatcher</span>
        </div>
      </div>
      <nav class="header-nav">
        <router-link to="/" class="nav-item" :class="{ active: isActive('/') }">
          <Monitor :size="16" />
          <span>录屏</span>
        </router-link>
        <router-link
          to="/records"
          class="nav-item"
          :class="{ active: isActive('/records') }"
        >
          <Film :size="16" />
          <span>录制列表</span>
        </router-link>
      </nav>
      <!-- 设置按钮 + 窗口控制按钮 -->
      <div class="header-actions">
        <button
          class="settings-btn"
          :class="{ active: isActive('/settings') }"
          @click="router.push('/settings')"
        >
          <Settings :size="18" />
          <span>设置</span>
        </button>
        <div v-if="!isMac" class="window-controls">
        <button class="window-btn minimize" @click="onMinimize">
          <Minus :size="12" />
        </button>
        <button class="window-btn maximize" @click="onMaximize">
          <Square :size="10" />
        </button>
        <button class="window-btn close" @click="onClose">
          <X :size="12" />
        </button>
      </div>
      </div>
    </header>

    <!-- 主体区域 -->
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: var(--bg-primary);
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 20px;
  background: var(--glass-low);
  border-bottom: 1px solid var(--glass-border);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  flex-shrink: 0;
  -webkit-app-region: drag;
  app-region: drag;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--glass-mid);
}

.nav-item.active {
  color: var(--accent);
  background: var(--bg-accent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  color: var(--text-primary);
  background: var(--glass-mid);
}

.settings-btn.active {
  color: var(--accent);
  background: var(--bg-accent);
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.window-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
  padding: 0;
}

.window-btn:hover {
  transform: scale(1.15);
}

.window-btn.minimize {
  background: #f59e0b;
}

.window-btn.maximize {
  background: #22c55e;
}

.window-btn.close {
  background: #ef4444;
}

.window-btn :deep(svg) {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.window-controls:hover .window-btn :deep(svg) {
  opacity: 1;
}

.app-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>

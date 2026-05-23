<script setup lang="ts">
import { Monitor } from 'lucide-vue-next'
</script>

<template>
  <div class="home-view">
    <Monitor class="icon" :size="64" />
    <h1>录屏主界面</h1>
    <p class="subtitle">选择录制区域并开始录屏</p>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.icon {
  color: var(--accent);
  opacity: 0.8;
}

h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>

<script setup lang="ts">
import { Film } from 'lucide-vue-next'
</script>

<template>
  <div class="records-view">
    <Film class="icon" :size="64" />
    <h1>录制列表</h1>
    <p class="subtitle">查看和管理录制的视频</p>
  </div>
</template>

<style scoped>
.records-view {
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

<script setup lang="ts">
import { Monitor } from 'lucide-vue-next'
</script>

<template>
  <div class="window-selector">
    <Monitor :size="48" class="placeholder-icon" />
    <h3>窗口选择功能开发中...</h3>
    <p>该功能将允许您选择要录制的特定窗口</p>
  </div>
</template>

<style scoped>
.window-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 32px;
  text-align: center;
}

.placeholder-icon {
  color: var(--accent);
  opacity: 0.5;
}

.window-selector h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.window-selector p {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>

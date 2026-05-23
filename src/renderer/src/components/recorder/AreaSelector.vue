<script setup lang="ts">
import { Square } from 'lucide-vue-next'
</script>

<template>
  <div class="area-selector">
    <Square :size="48" class="placeholder-icon" />
    <h3>区域选择功能开发中...</h3>
    <p>该功能将允许您框选屏幕上的特定录制区域</p>
  </div>
</template>

<style scoped>
.area-selector {
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

.area-selector h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.area-selector p {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>

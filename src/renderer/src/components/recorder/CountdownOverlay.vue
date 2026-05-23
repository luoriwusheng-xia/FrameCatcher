<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  seconds: number
}>()

const emit = defineEmits<{
  complete: []
}>()

const current = ref(props.seconds)
const isVisible = ref(true)
const isFading = ref(false)

onMounted(() => {
  const interval = setInterval(() => {
    if (current.value > 1) {
      current.value--
    } else {
      clearInterval(interval)
      // 最后一个数字显示完后淡出
      setTimeout(() => {
        isFading.value = true
        setTimeout(() => {
          isVisible.value = false
          emit('complete')
        }, 400)
      }, 600)
    }
  }, 1000)
})
</script>

<template>
  <Transition name="countdown">
    <div v-if="isVisible" class="countdown-overlay" :class="{ fading: isFading }">
      <div class="countdown-number">{{ current }}</div>
    </div>
  </Transition>
</template>

<style scoped>
.countdown-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000;
  transition: opacity 0.4s ease;
}

.countdown-overlay.fading {
  opacity: 0;
}

.countdown-number {
  font-size: 160px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 50%, #c4b5fd 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: count-pop 0.9s ease-out;
  text-shadow: 0 0 60px var(--accent-glow);
  line-height: 1;
}

@keyframes count-pop {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  40% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Vue Transition */
.countdown-enter-active,
.countdown-leave-active {
  transition: opacity 0.4s ease;
}

.countdown-enter-from,
.countdown-leave-to {
  opacity: 0;
}
</style>

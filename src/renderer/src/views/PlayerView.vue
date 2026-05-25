<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import VideoPlayer from '../components/player/VideoPlayer.vue'
import { replaceFileExtension, toMediaUrl } from '../utils/media'

const videoSrc = ref('')
const subtitleSrc = ref('')
let removePlayerLoadListener: (() => void) | null = null

function updateMediaSource(videoPath: string): void {
  if (!videoPath) {
    videoSrc.value = ''
    subtitleSrc.value = ''
    return
  }

  videoSrc.value = toMediaUrl(videoPath)
  subtitleSrc.value = toMediaUrl(replaceFileExtension(videoPath, '.vtt'))
}

onMounted(async () => {
  removePlayerLoadListener = window.api.player.onLoad((filePath) => {
    updateMediaSource(filePath)
  })

  const currentSource = await window.api.player.getCurrentSource()
  updateMediaSource(currentSource)
})

onUnmounted(() => {
  removePlayerLoadListener?.()
})
</script>

<template>
  <div class="player-page">
    <VideoPlayer :src="videoSrc" :subtitle-src="subtitleSrc" autoplay />
  </div>
</template>

<style scoped>
.player-page {
  width: 100vw;
  height: 100vh;
  background: var(--bg-primary);
  overflow: hidden;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import VideoPlayer from '../components/player/VideoPlayer.vue'

const route = useRoute()
const videoPath = ref('')

onMounted(() => {
  const path = route.params.path as string
  videoPath.value = decodeURIComponent(path)
})
</script>

<template>
  <div class="player-page">
    <VideoPlayer :src="videoPath" />
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

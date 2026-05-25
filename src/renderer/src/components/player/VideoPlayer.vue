<script setup lang="ts">
import { nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
import PlayerControls from './PlayerControls.vue'

const props = defineProps<{
  src: string
  subtitleSrc?: string
  autoplay?: boolean
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const playbackRate = ref(1)
const isFullscreen = ref(false)
const showControls = ref(true)
const subtitlesEnabled = ref(true)
const isDragging = ref(false)

let controlsHideTimer: ReturnType<typeof setTimeout> | null = null

function togglePlay() {
  const video = videoRef.value
  if (!video) return
  if (video.paused) {
    video.play()
  } else {
    video.pause()
  }
}

function seekTo(time: number) {
  const video = videoRef.value
  if (!video) return
  video.currentTime = Math.max(0, Math.min(time, duration.value))
}

function skipForward(seconds: number) {
  seekTo(currentTime.value + seconds)
}

function skipBackward(seconds: number) {
  seekTo(currentTime.value - seconds)
}

function setPlaybackRate(rate: number) {
  const video = videoRef.value
  if (!video) return
  playbackRate.value = rate
  video.playbackRate = rate
}

function setVolume(vol: number) {
  const video = videoRef.value
  if (!video) return
  volume.value = vol
  video.volume = vol
  if (vol > 0) {
    isMuted.value = false
    video.muted = false
  }
}

function toggleMute() {
  const video = videoRef.value
  if (!video) return
  isMuted.value = !isMuted.value
  video.muted = isMuted.value
}

async function toggleFullscreen() {
  const container = containerRef.value
  if (!container) return

  try {
    if (!document.fullscreenElement) {
      await container.requestFullscreen()
      isFullscreen.value = true
    } else {
      await document.exitFullscreen()
      isFullscreen.value = false
    }
  } catch {
    // fullscreen not supported or failed
  }
}

function toggleSubtitles() {
  const video = videoRef.value
  if (!video) return
  subtitlesEnabled.value = !subtitlesEnabled.value
  const track = video.textTracks[0]
  if (track) {
    track.mode = subtitlesEnabled.value ? 'showing' : 'hidden'
  }
}

function onMouseMove() {
  showControls.value = true
  if (controlsHideTimer) {
    clearTimeout(controlsHideTimer)
  }
  if (isPlaying.value) {
    controlsHideTimer = setTimeout(() => {
      showControls.value = false
    }, 3000)
  }
}

function onVideoClick() {
  togglePlay()
}

function onTimeUpdate() {
  if (!isDragging.value) {
    currentTime.value = videoRef.value?.currentTime ?? 0
  }
}

function onLoadedMetadata() {
  duration.value = videoRef.value?.duration ?? 0
  const track = videoRef.value?.textTracks[0]
  if (track) {
    track.mode = subtitlesEnabled.value ? 'showing' : 'hidden'
  }
}

function onPlay() {
  isPlaying.value = true
  if (controlsHideTimer) clearTimeout(controlsHideTimer)
  controlsHideTimer = setTimeout(() => {
    showControls.value = false
  }, 3000)
}

function onPause() {
  isPlaying.value = false
  showControls.value = true
  if (controlsHideTimer) {
    clearTimeout(controlsHideTimer)
    controlsHideTimer = null
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function onSeekStart() {
  isDragging.value = true
}

function onSeekEnd(time: number) {
  isDragging.value = false
  seekTo(time)
}

async function playCurrentSource(): Promise<void> {
  const video = videoRef.value
  if (!video || !props.autoplay || !props.src) return

  try {
    await video.play()
  } catch {
    // Ignore autoplay failures; the user can still start playback manually.
  }
}

watch(
  () => props.src,
  async () => {
    const video = videoRef.value

    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
    showControls.value = true
    isDragging.value = false
    if (controlsHideTimer) {
      clearTimeout(controlsHideTimer)
      controlsHideTimer = null
    }

    await nextTick()
    if (video) {
      video.pause()
      video.load()
      video.currentTime = 0
    }
    await playCurrentSource()
  }
)

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (controlsHideTimer) {
    clearTimeout(controlsHideTimer)
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="video-player"
    @mousemove="onMouseMove"
    @mouseleave="showControls = false"
  >
    <video
      ref="videoRef"
      class="video-element"
      :src="src"
      @click="onVideoClick"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @play="onPlay"
      @pause="onPause"
      @ended="isPlaying = false"
    >
      <track
        v-if="props.subtitleSrc"
        kind="subtitles"
        :src="props.subtitleSrc"
        srclang="zh"
        label="字幕"
        default
      />
    </video>

    <PlayerControls
      :is-playing="isPlaying"
      :current-time="currentTime"
      :duration="duration"
      :volume="volume"
      :is-muted="isMuted"
      :playback-rate="playbackRate"
      :is-fullscreen="isFullscreen"
      :subtitles-enabled="subtitlesEnabled"
      :show="showControls"
      @toggle-play="togglePlay"
      @skip-backward="skipBackward(5)"
      @skip-forward="skipForward(5)"
      @seek="seekTo"
      @seek-start="onSeekStart"
      @seek-end="onSeekEnd"
      @set-volume="setVolume"
      @toggle-mute="toggleMute"
      @set-playback-rate="setPlaybackRate"
      @toggle-fullscreen="toggleFullscreen"
      @toggle-subtitles="toggleSubtitles"
    />
  </div>
</template>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-player:hover {
  cursor: pointer;
}
</style>

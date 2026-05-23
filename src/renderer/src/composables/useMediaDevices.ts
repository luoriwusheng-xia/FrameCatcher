import { ref, onMounted } from 'vue'

export function useMediaDevices() {
  const microphones = ref<MediaDeviceInfo[]>([])
  const speakers = ref<MediaDeviceInfo[]>([])
  const cameras = ref<MediaDeviceInfo[]>([])
  const loading = ref(false)

  async function refreshDevices() {
    loading.value = true
    try {
      // 请求权限以获取完整的设备标签
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      microphones.value = devices.filter((d) => d.kind === 'audioinput')
      speakers.value = devices.filter((d) => d.kind === 'audiooutput')
      cameras.value = devices.filter((d) => d.kind === 'videoinput')
    } catch (err) {
      console.error('Failed to enumerate media devices:', err)
      // 即使权限被拒绝，也尝试枚举设备（标签可能为空）
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        microphones.value = devices.filter((d) => d.kind === 'audioinput')
        speakers.value = devices.filter((d) => d.kind === 'audiooutput')
        cameras.value = devices.filter((d) => d.kind === 'videoinput')
      } catch (enumErr) {
        console.error('Failed to enumerate devices:', enumErr)
      }
    } finally {
      loading.value = false
    }
  }

  onMounted(refreshDevices)

  return { microphones, speakers, cameras, loading, refreshDevices }
}

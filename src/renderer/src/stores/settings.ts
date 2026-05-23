import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import { AppSettings } from '../config/AppSettings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = reactive(new AppSettings())
  const isLoading = ref(true)

  async function load() {
    const data = await window.api.config.getAll()
    settings.fromJSON(data)
    isLoading.value = false
  }

  async function saveSection(section: string, data: Record<string, unknown>) {
    settings.setSection(section as any, data)
    await window.api.config.set(section, data)
  }

  return { settings, isLoading, load, saveSection }
})

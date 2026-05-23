import { GeneralConfig } from './GeneralConfig'
import { AudioConfig } from './AudioConfig'
import { WatermarkConfig } from './WatermarkConfig'

export class AppSettings {
  general = new GeneralConfig()
  audio = new AudioConfig()
  watermark = new WatermarkConfig()

  private _listeners: Array<(section: string, key: string, value: unknown) => void> = []

  onChange(
    listener: (section: string, key: string, value: unknown) => void
  ): () => void {
    this._listeners.push(listener)
    return () => {
      const i = this._listeners.indexOf(listener)
      if (i > -1) this._listeners.splice(i, 1)
    }
  }

  private _notify(section: string, key: string, value: unknown): void {
    for (const fn of this._listeners) fn(section, key, value)
  }

  setSection(
    section: 'general' | 'audio' | 'watermark',
    data: Record<string, unknown>
  ): void {
    const target = this[section]
    target.setPartial(data as any)
    for (const [key, value] of Object.entries(data)) {
      this._notify(section, key, value)
    }
  }

  toJSON(): Record<string, Record<string, unknown>> {
    return {
      general: this.general.toJSON(),
      audio: this.audio.toJSON(),
      watermark: this.watermark.toJSON()
    }
  }

  fromJSON(data: Record<string, Record<string, unknown>>): void {
    this.general.setPartial(data.general as any)
    this.audio.setPartial(data.audio as any)
    this.watermark.setPartial(data.watermark as any)
  }
}

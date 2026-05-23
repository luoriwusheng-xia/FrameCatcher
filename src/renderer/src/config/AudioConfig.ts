import { ConfigSection } from './ConfigSection'

export class AudioConfig extends ConfigSection {
  micVolume: number = 80
  speakerVolume: number = 80
  defaultMic: string = 'default'
  defaultSpeaker: string = 'default'

  protected _validators = {
    micVolume: (v: unknown) => typeof v === 'number' && v >= 0 && v <= 100,
    speakerVolume: (v: unknown) => typeof v === 'number' && v >= 0 && v <= 100,
    defaultMic: (v: unknown) => typeof v === 'string',
    defaultSpeaker: (v: unknown) => typeof v === 'string'
  }

  setMicVolume(vol: number): void {
    this._setValidated('micVolume', vol)
  }

  setSpeakerVolume(vol: number): void {
    this._setValidated('speakerVolume', vol)
  }

  setDefaultMic(id: string): void {
    this._setValidated('defaultMic', id)
  }

  setDefaultSpeaker(id: string): void {
    this._setValidated('defaultSpeaker', id)
  }

  getDefaults() {
    return {
      micVolume: 80,
      speakerVolume: 80,
      defaultMic: 'default',
      defaultSpeaker: 'default'
    }
  }
}

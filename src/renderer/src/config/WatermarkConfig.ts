import { ConfigSection } from './ConfigSection'

export class WatermarkConfig extends ConfigSection {
  enabled: boolean = false
  type: 'none' | 'text' | 'image' = 'none'
  text: string = ''
  textColor: string = '#ffffff'
  fontSize: number = 24
  density: 'low' | 'medium' | 'high' = 'medium'
  imagePath: string = ''
  imageOpacity: number = 50

  protected _validators = {
    enabled: (v: unknown) => typeof v === 'boolean',
    type: (v: unknown) => ['none', 'text', 'image'].includes(v as string),
    text: (v: unknown) => typeof v === 'string' && (v as string).length <= 30,
    textColor: (v: unknown) => typeof v === 'string',
    fontSize: (v: unknown) => typeof v === 'number' && (v as number) > 0,
    density: (v: unknown) => ['low', 'medium', 'high'].includes(v as string),
    imagePath: (v: unknown) => typeof v === 'string',
    imageOpacity: (v: unknown) =>
      typeof v === 'number' && (v as number) >= 0 && (v as number) <= 100
  }

  setEnabled(enabled: boolean): void {
    this._setValidated('enabled', enabled)
  }

  setType(type: 'none' | 'text' | 'image'): void {
    this._setValidated('type', type)
  }

  setText(text: string): void {
    this._setValidated('text', text)
  }

  setTextColor(color: string): void {
    this._setValidated('textColor', color)
  }

  setFontSize(size: number): void {
    this._setValidated('fontSize', size)
  }

  setDensity(density: 'low' | 'medium' | 'high'): void {
    this._setValidated('density', density)
  }

  setImagePath(path: string): void {
    this._setValidated('imagePath', path)
  }

  setImageOpacity(opacity: number): void {
    this._setValidated('imageOpacity', opacity)
  }

  getDefaults() {
    return {
      enabled: false,
      type: 'none' as const,
      text: '',
      textColor: '#ffffff',
      fontSize: 24,
      density: 'medium' as const,
      imagePath: '',
      imageOpacity: 50
    }
  }
}

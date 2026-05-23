export abstract class ConfigSection {
  protected _validators?: Record<string, (v: unknown) => boolean>

  abstract getDefaults(): Record<string, unknown>

  setPartial(data: Partial<this>): void {
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key in this) {
        this._setValidated(key, value)
      }
    }
  }

  protected _setValidated(key: string, value: unknown): void {
    const validators = (this as any)._validators
    if (validators && validators[key] && !validators[key](value)) {
      throw new TypeError(`Invalid value for ${key}: ${value}`)
    }
    ;(this as any)[key] = value
  }

  reset(): void {
    Object.assign(this, this.getDefaults())
  }

  toJSON(): Record<string, unknown> {
    const entries = Object.entries(this).filter(
      ([k]) => !k.startsWith('_') && typeof (this as any)[k] !== 'function'
    )
    return Object.fromEntries(entries)
  }
}

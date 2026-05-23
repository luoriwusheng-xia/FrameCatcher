import { ConfigSection } from './ConfigSection'

export class GeneralConfig extends ConfigSection {
  outputDir: string = ''

  protected _validators = {
    outputDir: (v: unknown) => typeof v === 'string'
  }

  setOutputDir(path: string): void {
    this._setValidated('outputDir', path)
  }

  getDefaults() {
    return { outputDir: '' }
  }
}

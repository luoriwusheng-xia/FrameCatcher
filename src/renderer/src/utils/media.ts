export function toMediaUrl(filePath: string): string {
  if (!filePath) return ''
  return window.api.media.toFileUrl(filePath)
}

export function replaceFileExtension(filePath: string, extension: string): string {
  if (!filePath) return ''
  const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`
  return filePath.replace(/\.[^/.]+$/, normalizedExtension)
}

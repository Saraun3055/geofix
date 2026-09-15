export async function uploadPhoto(file: File, _path?: string): Promise<string> {
  // No cloud storage: read the file locally so the UI works end-to-end.
  return readAsDataUrl(file)
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadPhotos(files: File[], basePath: string): Promise<string[]> {
  const urls: string[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!
    const url = await uploadPhoto(file, `${basePath}/${Date.now()}-${i}.${file.name.split('.').pop()}`)
    urls.push(url)
  }
  return urls
}
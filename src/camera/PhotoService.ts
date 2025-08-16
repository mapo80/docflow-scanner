export class PhotoService {
  static canUseImageCapture(stream: MediaStream): boolean {
    const track = stream.getVideoTracks()[0]
    return typeof (window as any).ImageCapture === 'function' && !!track
  }

  static async takePhoto(stream: MediaStream): Promise<Blob> {
    const track = stream.getVideoTracks()[0]
    if ((window as any).ImageCapture) {
      const ic = new (window as any).ImageCapture(track)
      const blob: Blob = await ic.takePhoto().catch(async () => {
        const bmp = await ic.grabFrame()
        const canvas = new OffscreenCanvas(bmp.width, bmp.height)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bmp, 0, 0)
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 })
        return blob
      })
      return blob
    }
    // Fallback: capture from a hidden canvas (lower quality)
    const video = document.querySelector('video') as HTMLVideoElement
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    return await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.92)!)
  }
}

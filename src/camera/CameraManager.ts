export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 }
    },
    audio: false
  })
  video.srcObject = stream
  await video.play()
  return stream
}

export function stopCamera(stream: MediaStream) {
  stream.getTracks().forEach(t => t.stop())
}

export async function applyTrackConstraints(stream: MediaStream, opts: { focusMode?: 'continuous' | 'manual', zoom?: number, frameRate?: number }) {
  const track = stream.getVideoTracks()[0]
  const caps = track.getCapabilities?.() as any || {}
  const constraints: MediaTrackConstraints = { advanced: [] }
  if ('focusMode' in caps && opts.focusMode) (constraints.advanced as any[]).push({ focusMode: opts.focusMode })
  if ('zoom' in caps && opts.zoom) (constraints.advanced as any[]).push({ zoom: opts.zoom })
  if (opts.frameRate) (constraints.advanced as any[]).push({ frameRate: opts.frameRate })
  if ((constraints.advanced as any[]).length) await track.applyConstraints(constraints)
}

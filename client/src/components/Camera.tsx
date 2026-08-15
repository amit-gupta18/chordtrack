import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { CameraStatus } from '../types/hand'

interface CameraProps {
  onStatusChange?: (status: CameraStatus) => void
}

export interface CameraHandle {
  getVideo: () => HTMLVideoElement | null
}

export const Camera = forwardRef<CameraHandle, CameraProps>(function Camera(
  { onStatusChange },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<CameraStatus>('loading')

  useImperativeHandle(ref, () => ({
    getVideo: () => videoRef.current,
  }))

  useEffect(() => {
    onStatusChange?.(status)
  }, [onStatusChange, status])

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false

    async function startCamera() {
      setStatus('loading')

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        const video = videoRef.current
        if (!video) return

        video.srcObject = stream

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve()
          video.onerror = () => reject(new Error('Video failed to load'))
        })

        await video.play()
        if (!cancelled) setStatus('active')
      } catch (error) {
        if (cancelled) return
        const name = error instanceof DOMException ? error.name : ''
        setStatus(name === 'NotAllowedError' ? 'denied' : 'error')
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      autoPlay
      playsInline
      muted
    />
  )
})

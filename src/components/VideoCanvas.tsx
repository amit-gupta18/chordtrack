import { useEffect, useRef } from 'react'
import type { Landmark } from '../types/hand'
import { HAND_CONNECTIONS, toCanvasCoords } from '../vision/landmarkUtils'

interface VideoCanvasProps {
  video: HTMLVideoElement | null
  landmarks: Landmark[] | null
  showSkeleton: boolean
}

export function VideoCanvas({ video, landmarks, showSkeleton }: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameId = 0

    const draw = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        frameId = requestAnimationFrame(draw)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (showSkeleton && landmarks) {
        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 3
        ctx.fillStyle = '#f97316'

        for (const [start, end] of HAND_CONNECTIONS) {
          const a = toCanvasCoords(landmarks[start], canvas.width, canvas.height)
          const b = toCanvasCoords(landmarks[end], canvas.width, canvas.height)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }

        for (const landmark of landmarks) {
          const { x, y } = toCanvasCoords(
            landmark,
            canvas.width,
            canvas.height,
          )
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(frameId)
  }, [video, landmarks, showSkeleton])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover"
    />
  )
}

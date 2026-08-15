import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Camera, type CameraHandle } from '../components/Camera'
import { ChordSelector } from '../components/ChordSelector'
import { SelfReportForm } from '../components/SelfReportForm'
import { Statistics } from '../components/Statistics'
import { SwitchCounter } from '../components/SwitchCounter'
import { Timer } from '../components/Timer'
import { VideoCanvas } from '../components/VideoCanvas'
import { useHandTracking } from '../hooks/useHandTracking'
import { buildSessionStats, toSessionPayload } from '../logic/sessionManager'
import {
  createSwitchDetector,
  resetSwitchDetector,
  updateSwitchDetector,
} from '../logic/switchDetector'
import { playStartBeep } from '../logic/timer'
import { useCreateSession } from '../queries/useSessions'
import { useTrainerStore } from '../stores/useTrainerStore'
import type { CameraStatus, ChordId } from '../types/hand'
import type { SelfReport } from '../api/sessions'

export function TrainerPage() {
  const cameraRef = useRef<CameraHandle>(null)
  const switchDetectorRef = useRef(createSwitchDetector())
  const recognitionRef = useRef<import('../types/hand').RecognitionResult>({
    chord: 'Unknown',
    confidence: 0,
    scoreA: 0,
    scoreD: 0,
  })

  const {
    session,
    durationMs,
    bpm,
    setDurationMs,
    setBpm,
    startCalibration,
    addCalibrationFrame,
    beginCountdown,
    tickCountdown,
    updateRunning,
    reset,
    calibrated,
  } = useTrainerStore()

  const createSession = useCreateSession()
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('loading')
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [saved, setSaved] = useState(false)

  const handleFrame = useCallback(
    (frameFeatures: import('../types/hand').FeatureVector | null) => {
      if (!frameFeatures || session.phase !== 'calibrating') return
      addCalibrationFrame(frameFeatures)
    },
    [session.phase, addCalibrationFrame],
  )

  const { landmarks, recognition, trackerReady } = useHandTracking({
    cameraRef,
    enabled: cameraStatus === 'active',
    templates: session.templates,
    onFrame: handleFrame,
  })

  useEffect(() => {
    recognitionRef.current = recognition
  }, [recognition])

  useEffect(() => {
    if (cameraStatus !== 'active') return
    const id = window.setInterval(() => {
      setVideo(cameraRef.current?.getVideo() ?? null)
    }, 250)
    return () => window.clearInterval(id)
  }, [cameraStatus])

  useEffect(() => {
    if (session.phase !== 'countdown') return
    const id = window.setInterval(() => {
      const prevPhase = useTrainerStore.getState().session.phase
      tickCountdown()
      const nextPhase = useTrainerStore.getState().session.phase
      if (nextPhase === 'running' && prevPhase === 'countdown') {
        playStartBeep()
        resetSwitchDetector(switchDetectorRef.current)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [session.phase, tickCountdown])

  useEffect(() => {
    if (session.phase !== 'running') return
    const id = window.setInterval(() => {
      const stats = updateSwitchDetector(
        switchDetectorRef.current,
        recognitionRef.current.chord,
        performance.now(),
      )
      updateRunning(stats.switchCount, stats.switchTimestamps, stats.stableChord)
    }, 33)
    return () => window.clearInterval(id)
  }, [session.phase, updateRunning])

  const stats = useMemo(
    () => buildSessionStats(session, durationMs),
    [session, durationMs],
  )

  const handleCapture = useCallback(
    (chord: ChordId) => startCalibration(chord),
    [startCalibration],
  )

  const handleStartPractice = useCallback(() => {
    if (!calibrated()) return
    resetSwitchDetector(switchDetectorRef.current)
    setSaved(false)
    beginCountdown()
  }, [calibrated, beginCountdown])

  const handleReset = useCallback(() => {
    resetSwitchDetector(switchDetectorRef.current)
    reset()
    setSaved(false)
  }, [reset])

  const handleClearTemplates = useCallback(() => {
    resetSwitchDetector(switchDetectorRef.current)
    reset(true)
    setSaved(false)
  }, [reset])

  const handleSelfReport = useCallback(
    async (selfReport: SelfReport) => {
      await createSession.mutateAsync(
        toSessionPayload(session, bpm, durationMs, selfReport),
      )
      setSaved(true)
    },
    [createSession, session, bpm, durationMs],
  )

  const isCalibrated = calibrated()
  const isSessionActive = session.phase === 'countdown' || session.phase === 'running'
  const durationSeconds = Math.round(durationMs / 1000)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Chord Transition Trainer</h1>
        <p className="mt-1 text-slate-400">
          Calibrate A and D major, then switch chords for {durationSeconds} seconds.
        </p>
      </header>

      <div className="flex flex-wrap gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
        <label className="text-sm text-slate-300">
          BPM
          <input
            type="number"
            min={40}
            max={200}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            disabled={isSessionActive}
            className="ml-2 w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
          />
        </label>
        <label className="text-sm text-slate-300">
          Duration (sec)
          <input
            type="number"
            min={15}
            max={300}
            value={durationSeconds}
            onChange={(e) => setDurationMs(Number(e.target.value) * 1000)}
            disabled={isSessionActive}
            className="ml-2 w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
          />
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-700 bg-black">
            <Camera ref={cameraRef} onStatusChange={setCameraStatus} />
            <VideoCanvas video={video} landmarks={landmarks} showSkeleton={showSkeleton} />

            {cameraStatus === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-slate-300">
                Starting camera…
              </div>
            )}
            {cameraStatus === 'denied' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-sm text-red-300">
                Camera permission denied. Allow webcam access and reload.
              </div>
            )}
            {cameraStatus === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-sm text-red-300">
                Unable to access the camera.
              </div>
            )}
            {session.phase === 'countdown' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-8xl font-bold text-white">{session.countdownValue}</span>
              </div>
            )}
            {!trackerReady && cameraStatus === 'active' && (
              <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-slate-300">
                Loading hand tracker…
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showSkeleton}
              onChange={(e) => setShowSkeleton(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800"
            />
            Show hand skeleton (debug)
          </label>
        </section>

        <section className="space-y-4">
          <Timer
            remainingMs={stats.remainingMs}
            elapsedMs={stats.elapsedMs}
            phase={session.phase}
            countdownValue={session.countdownValue}
          />
          <SwitchCounter count={stats.switchCount} />
          <Statistics stats={stats} recognition={recognition} phase={session.phase} />
          <ChordSelector
            templates={session.templates}
            phase={session.phase}
            calibrationTarget={session.calibrationTarget}
            calibrationProgress={session.calibrationBuffer.length}
            onCapture={handleCapture}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStartPractice}
              disabled={!isCalibrated || isSessionActive}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Practice
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-600 px-4 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleClearTemplates}
              className="rounded-xl border border-slate-600 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Clear Templates
            </button>
          </div>

          {session.phase === 'finished' && !saved && (
            <SelfReportForm
              onSubmit={handleSelfReport}
              isSubmitting={createSession.isPending}
            />
          )}

          {saved && (
            <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/40 p-4 text-sm text-emerald-200">
              Session saved! {stats.switchCount} switches ({stats.switchesPerMinute.toFixed(1)}/min).
            </div>
          )}

          {session.phase === 'finished' && !saved && (
            <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/40 p-4 text-sm text-emerald-200">
              Session complete. You made {stats.switchCount} switches (
              {stats.switchesPerMinute.toFixed(1)} per minute).
            </div>
          )}

          {!isCalibrated && (
            <p className="text-sm text-amber-300">
              Capture both A and D templates before starting practice.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

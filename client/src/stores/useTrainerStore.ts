import { create } from 'zustand'
import {
  addCalibrationFrame,
  beginCountdown,
  createSessionState,
  finalizeCalibration,
  isCalibrated,
  resetSession,
  startCalibration,
  tickCountdown,
  updateRunningSession,
  type SessionState,
} from '../logic/sessionManager'
import type { ChordId } from '../types/hand'

interface TrainerStore {
  session: SessionState
  durationMs: number
  bpm: number
  setDurationMs: (ms: number) => void
  setBpm: (bpm: number) => void
  startCalibration: (chord: ChordId) => void
  addCalibrationFrame: (features: number[]) => void
  beginCountdown: () => void
  tickCountdown: () => void
  updateRunning: (
    switchCount: number,
    switchTimestamps: number[],
    stableChord: SessionState['stableChord'],
  ) => void
  reset: (clearTemplates?: boolean) => void
  calibrated: () => boolean
}

export const useTrainerStore = create<TrainerStore>((set, get) => ({
  session: createSessionState(),
  durationMs: 60_000,
  bpm: 80,

  setDurationMs: (durationMs) => set({ durationMs }),
  setBpm: (bpm) => set({ bpm }),

  startCalibration: (chord) =>
    set((s) => ({ session: startCalibration(s.session, chord) })),

  addCalibrationFrame: (features) =>
    set((s) => {
      let session = addCalibrationFrame(s.session, features)
      if (session.calibrationBuffer.length >= 15) {
        session = finalizeCalibration(session)
      }
      return { session }
    }),

  beginCountdown: () =>
    set((s) => ({ session: beginCountdown(s.session) })),

  tickCountdown: () =>
    set((s) => ({ session: tickCountdown(s.session, s.durationMs) })),

  updateRunning: (switchCount, switchTimestamps, stableChord) =>
    set((s) => ({
      session: updateRunningSession(
        s.session,
        switchCount,
        switchTimestamps,
        stableChord,
      ),
    })),

  reset: (clearTemplates) =>
    set((s) => ({ session: resetSession(s.session, clearTemplates) })),

  calibrated: () => isCalibrated(get().session.templates),
}))

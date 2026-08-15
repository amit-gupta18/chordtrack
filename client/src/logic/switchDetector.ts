import type { DetectedChord, SwitchStats } from '../types/hand'
import { STABLE_FRAMES } from '../types/hand'

export function createSwitchDetector(): SwitchStats & {
  candidateChord: DetectedChord
  candidateFrames: number
} {
  return {
    switchCount: 0,
    switchTimestamps: [],
    stableChord: 'Unknown',
    candidateChord: 'Unknown',
    candidateFrames: 0,
  }
}

export function updateSwitchDetector(
  state: ReturnType<typeof createSwitchDetector>,
  detectedChord: DetectedChord,
  timestamp: number,
): SwitchStats {
  if (detectedChord === 'Unknown') {
    state.candidateChord = 'Unknown'
    state.candidateFrames = 0
    return {
      switchCount: state.switchCount,
      switchTimestamps: state.switchTimestamps,
      stableChord: state.stableChord,
    }
  }

  if (detectedChord === state.candidateChord) {
    state.candidateFrames += 1
  } else {
    state.candidateChord = detectedChord
    state.candidateFrames = 1
  }

  if (state.candidateFrames >= STABLE_FRAMES) {
    const previousStable = state.stableChord

    if (
      previousStable !== detectedChord &&
      previousStable !== 'Unknown' &&
      (previousStable === 'A' || previousStable === 'D') &&
      (detectedChord === 'A' || detectedChord === 'D')
    ) {
      state.switchCount += 1
      state.switchTimestamps.push(timestamp)
    }

    state.stableChord = detectedChord
  }

  return {
    switchCount: state.switchCount,
    switchTimestamps: state.switchTimestamps,
    stableChord: state.stableChord,
  }
}

export function resetSwitchDetector(
  state: ReturnType<typeof createSwitchDetector>,
): void {
  state.switchCount = 0
  state.switchTimestamps = []
  state.stableChord = 'Unknown'
  state.candidateChord = 'Unknown'
  state.candidateFrames = 0
}

export function averageSwitchTimeMs(timestamps: number[]): number | null {
  if (timestamps.length < 2) return null

  let total = 0
  for (let i = 1; i < timestamps.length; i++) {
    total += timestamps[i] - timestamps[i - 1]
  }

  return total / (timestamps.length - 1)
}

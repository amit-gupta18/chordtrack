export const MIN_SESSION_DURATION_SECONDS = 30
export const MAX_SESSION_DURATION_SECONDS = 600
export const DEFAULT_SESSION_DURATION_SECONDS = 60

export function clampSessionDuration(seconds: number): number {
  return Math.min(
    MAX_SESSION_DURATION_SECONDS,
    Math.max(MIN_SESSION_DURATION_SECONDS, Math.round(seconds)),
  )
}

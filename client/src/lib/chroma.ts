export function computeChromaFromFft(
  frequencyData: Float32Array,
  sampleRate: number,
): number[] {
  const chroma = new Array<number>(12).fill(0)
  const binHz = sampleRate / (2 * frequencyData.length)

  for (let i = 1; i < frequencyData.length; i++) {
    const db = frequencyData[i]!
    if (db < -72) continue

    const freq = i * binHz
    // Guitar fundamentals + harmonics (open strings ~80–330 Hz)
    if (freq < 75 || freq > 1400) continue

    const magnitude = 10 ** (db / 20)
    const midi = Math.round(12 * Math.log2(freq / 440)) + 69
    const pitchClass = ((midi % 12) + 12) % 12

    // Weight fundamentals more than harmonics for clearer chord ID
    const harmonicWeight = freq < 350 ? 1.4 : freq < 700 ? 1.0 : 0.6
    chroma[pitchClass]! += magnitude * harmonicWeight
  }

  const peak = Math.max(...chroma)
  if (peak === 0) return chroma

  const normalized = chroma.map((value) => value / peak)

  // Sharpen peaks — suppress weak noise bins
  return normalized.map((v) => (v < 0.12 ? 0 : v ** 1.5))
}

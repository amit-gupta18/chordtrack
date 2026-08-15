export function computeChromaFromFft(
  frequencyData: Float32Array,
  sampleRate: number,
): number[] {
  const chroma = new Array<number>(12).fill(0)
  const binHz = sampleRate / (2 * frequencyData.length)

  for (let i = 1; i < frequencyData.length; i++) {
    const db = frequencyData[i]!
    if (db < -65) continue

    const freq = i * binHz
    if (freq < 70 || freq > 1500) continue

    const magnitude = 10 ** (db / 20)
    const midi = Math.round(12 * Math.log2(freq / 440)) + 69
    const pitchClass = ((midi % 12) + 12) % 12
    chroma[pitchClass]! += magnitude
  }

  const peak = Math.max(...chroma)
  if (peak === 0) return chroma
  return chroma.map((value) => value / peak)
}

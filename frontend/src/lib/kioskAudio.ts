/**
 * Synthesizes audio feedback for Kiosk events using Web Audio API and Web Speech API.
 * Pure native browser APIs with no external mp3 or audio file dependencies.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContextClass()
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume()
    }
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Pleasant ascending two-tone / chord chime for successful check-in
 */
export function playSuccessChime(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99] // C5, E5, G5

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, now + idx * 0.08)

    gain.gain.setValueAtTime(0, now + idx * 0.08)
    gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + idx * 0.08)
    osc.stop(now + idx * 0.08 + 0.5)
  })
}

/**
 * Low descending alert tone for access denied / expired / error
 */
export function playErrorChime(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [329.63, 261.63] // E4, C4

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "triangle"
    osc.frequency.setValueAtTime(freq, now + idx * 0.12)

    gain.gain.setValueAtTime(0, now + idx * 0.12)
    gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + idx * 0.12)
    osc.stop(now + idx * 0.12 + 0.45)
  })
}

/**
 * Triumphant fanfare chord sequence for milestone check-in celebration
 */
export function playMilestoneChime(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const chords = [
    { freq: 523.25, time: 0 },    // C5
    { freq: 659.25, time: 0.1 },  // E5
    { freq: 783.99, time: 0.2 },  // G5
    { freq: 1046.5, time: 0.35 }, // C6
  ]

  chords.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, now + time)

    gain.gain.setValueAtTime(0, now + time)
    gain.gain.linearRampToValueAtTime(0.3, now + time + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.7)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + time)
    osc.stop(now + time + 0.7)
  })
}

/**
 * Speaks text using the browser SpeechSynthesis API.
 * Uses Vietnamese voice if available, otherwise falls back to system default.
 */
export function speakKioskGreeting(
  text: string,
  enabled = true,
  lang = "vi-VN",
): void {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return

  try {
    // Cancel any running speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 1.0
    utterance.pitch = 1.0

    // Try to find a matching voice for Vietnamese or fallback
    const voices = window.speechSynthesis.getVoices()
    const matchedVoice = voices.find((v) => v.lang.startsWith("vi")) || voices.find((v) => v.lang.startsWith(lang.substring(0, 2)))
    if (matchedVoice) {
      utterance.voice = matchedVoice
    }

    window.speechSynthesis.speak(utterance)
  } catch {
    // Gracefully ignore voice synthesis errors
  }
}

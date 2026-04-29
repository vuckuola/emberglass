export type MusicTrack = 'title' | 'town' | 'dungeon' | 'battle' | 'boss' | 'victory' | null

export type SfxName =
  | 'ui_blip'
  | 'ui_menu_open'
  | 'ui_confirm'
  | 'ui_cancel'
  | 'item_use'
  | 'chest_open'
  | 'merchant_trade'
  | 'objective_update'
  | 'save_point'
  | 'shrine_beat'
  | 'field_interact'
  | 'victory_fanfare'
  | 'reward_gain'
  | 'equipment_gain'
  | 'attack_swing'
  | 'attack_thrust'
  | 'magic_cast'
  | 'defend_guard'
  | 'hit_physical'
  | 'hit_magical'
  | 'heal'
  | 'impact_heavy'
  | 'critical_flash'
  | 'stagger_break'
  | 'level_up'

type ActiveMusicTrack = Exclude<MusicTrack, null>

type AudioSettings = {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
}

type ActiveMusic = {
  gain: GainNode
  generation: number
  nodes: AudioScheduledSourceNode[]
  timerId: number | null
  track: ActiveMusicTrack
}

type ToneOptions = {
  attack?: number
  destination: AudioNode
  duration: number
  endFrequency?: number
  frequency: number
  gain: number
  nodes?: AudioScheduledSourceNode[]
  release?: number
  startTime: number
  type?: OscillatorType
}

type NoiseOptions = {
  attack?: number
  destination: AudioNode
  duration: number
  filterFrequency?: number
  filterQ?: number
  filterType?: BiquadFilterType
  gain: number
  nodes?: AudioScheduledSourceNode[]
  release?: number
  startTime: number
}

const SETTINGS_KEY = 'emberglass_audio_settings'
const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.85,
  musicVolume: 0.55,
  sfxVolume: 0.75,
}
const FADE_SECONDS = 0.3
const LOOP_LOOK_AHEAD_SECONDS = 0.5

const tideBellStageOffset = (stage: number): number => {
  return Math.max(0, Math.min(4, Math.floor(stage))) * 18
}

export class AudioManager {
  private activeMusic: ActiveMusic | null = null
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private musicGeneration = 0
  private musicGain: GainNode | null = null
  private settings: AudioSettings = this.loadSettings()
  private sfxGain: GainNode | null = null
  private unlockListenersBound = false

  constructor() {
    this.bindUnlockListeners()
  }

  playMusic(track: MusicTrack): void {
    if (track === null) {
      this.stopMusic()
      return
    }

    const context = this.ensureContext()

    if (!context || !this.musicGain) {
      return
    }

    void this.resume()

    if (this.activeMusic?.track === track) {
      return
    }

    this.stopMusic()

    const gain = context.createGain()
    const now = context.currentTime
    const generation = ++this.musicGeneration
    const active: ActiveMusic = {
      gain,
      generation,
      nodes: [],
      timerId: null,
      track,
    }

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(1, now + FADE_SECONDS)
    gain.connect(this.musicGain)
    this.activeMusic = active

    this.scheduleMusicLoop(active, now + 0.02)
  }

  stopMusic(): void {
    const active = this.activeMusic

    if (!active || !this.context) {
      return
    }

    this.activeMusic = null
    this.musicGeneration += 1

    if (active.timerId !== null) {
      window.clearTimeout(active.timerId)
      active.timerId = null
    }

    const now = this.context.currentTime
    const endTime = now + FADE_SECONDS

    active.gain.gain.cancelScheduledValues(now)
    active.gain.gain.setValueAtTime(active.gain.gain.value, now)
    active.gain.gain.linearRampToValueAtTime(0, endTime)

    active.nodes.forEach((node) => {
      try {
        node.stop(endTime + 0.05)
      } catch {
        // A source may already have ended by the time a transition starts.
      }
    })

    window.setTimeout(() => {
      active.gain.disconnect()
    }, (FADE_SECONDS + 0.1) * 1000)
  }

  playSfx(name: SfxName): void {
    const context = this.ensureContext()

    if (!context || !this.sfxGain) {
      return
    }

    void this.resume()

    const startTime = context.currentTime + 0.01
    const sfxGain = this.sfxGain

    switch (name) {
      case 'ui_blip':
        this.scheduleTone({
          destination: sfxGain,
          duration: 0.05,
          frequency: 440,
          gain: 0.18,
          release: 0.015,
          startTime,
          type: 'sine',
        })
        break
      case 'ui_menu_open':
        ;[392, 523, 659].forEach((frequency, index) => {
          this.scheduleTone({ destination: sfxGain, duration: 0.09, frequency, gain: 0.075, release: 0.05, startTime: startTime + index * 0.035, type: 'triangle' })
        })
        break
      case 'ui_confirm':
        this.scheduleTone({
          destination: sfxGain,
          duration: 0.055,
          frequency: 330,
          gain: 0.16,
          release: 0.01,
          startTime,
          type: 'sine',
        })
        this.scheduleTone({
          destination: sfxGain,
          duration: 0.055,
          frequency: 440,
          gain: 0.16,
          release: 0.02,
          startTime: startTime + 0.055,
          type: 'sine',
        })
        break
      case 'ui_cancel':
        this.scheduleTone({
          destination: sfxGain,
          duration: 0.055,
          frequency: 440,
          gain: 0.15,
          release: 0.01,
          startTime,
          type: 'triangle',
        })
        this.scheduleTone({
          destination: sfxGain,
          duration: 0.055,
          frequency: 330,
          gain: 0.15,
          release: 0.02,
          startTime: startTime + 0.055,
          type: 'triangle',
        })
        break
      case 'item_use':
        this.scheduleTone({ destination: sfxGain, duration: 0.2, endFrequency: 760, frequency: 310, gain: 0.12, release: 0.09, startTime, type: 'triangle' })
        this.scheduleNoise({ destination: sfxGain, duration: 0.18, filterFrequency: 3200, filterQ: 1.2, filterType: 'highpass', gain: 0.05, release: 0.12, startTime: startTime + 0.02 })
        break
      case 'chest_open':
        this.scheduleTone({ destination: sfxGain, duration: 0.16, endFrequency: 95, frequency: 150, gain: 0.16, release: 0.09, startTime, type: 'square' })
        ;[523, 659, 784].forEach((frequency, index) => this.scheduleTone({ destination: sfxGain, duration: 0.18, frequency, gain: 0.085, release: 0.08, startTime: startTime + 0.11 + index * 0.055, type: 'sine' }))
        break
      case 'merchant_trade':
        ;[988, 1175, 784].forEach((frequency, index) => this.scheduleTone({ destination: sfxGain, duration: 0.07, frequency, gain: 0.11, release: 0.03, startTime: startTime + index * 0.06, type: 'triangle' }))
        break
      case 'objective_update':
        this.playResonancePulse('objective')
        break
      case 'save_point':
        ;[330, 494, 660, 990].forEach((frequency, index) => this.scheduleTone({ attack: 0.02, destination: sfxGain, duration: 0.42, frequency, gain: 0.065, release: 0.28, startTime: startTime + index * 0.08, type: 'sine' }))
        break
      case 'shrine_beat':
        this.playTideBell(0)
        break
      case 'field_interact':
        this.scheduleTone({ destination: sfxGain, duration: 0.13, endFrequency: 280, frequency: 420, gain: 0.09, release: 0.07, startTime, type: 'triangle' })
        break
      case 'victory_fanfare':
        ;[523, 659, 784, 1047].forEach((frequency, index) => this.scheduleTone({ destination: sfxGain, duration: index === 3 ? 0.42 : 0.14, frequency, gain: 0.13, release: 0.12, startTime: startTime + index * 0.12, type: 'triangle' }))
        break
      case 'reward_gain':
        ;[784, 1047, 1319].forEach((frequency, index) => this.scheduleTone({ destination: sfxGain, duration: 0.12, frequency, gain: 0.1, release: 0.06, startTime: startTime + index * 0.07, type: 'sine' }))
        break
      case 'equipment_gain':
        ;[196, 392, 587, 784].forEach((frequency, index) => this.scheduleTone({ attack: 0.01, destination: sfxGain, duration: 0.24, frequency, gain: 0.095, release: 0.12, startTime: startTime + index * 0.06, type: index === 0 ? 'triangle' : 'sine' }))
        break
      case 'attack_swing':
        this.scheduleNoise({
          destination: sfxGain,
          duration: 0.1,
          filterFrequency: 1800,
          filterQ: 0.8,
          filterType: 'bandpass',
          gain: 0.22,
          release: 0.08,
          startTime,
        })
        this.scheduleTone({
          destination: sfxGain,
          duration: 0.1,
          endFrequency: 140,
          frequency: 520,
          gain: 0.08,
          release: 0.08,
          startTime,
          type: 'sawtooth',
        })
        break
      case 'attack_thrust':
        this.scheduleNoise({ destination: sfxGain, duration: 0.07, filterFrequency: 2600, filterQ: 1.1, filterType: 'bandpass', gain: 0.18, release: 0.04, startTime })
        this.scheduleTone({ destination: sfxGain, duration: 0.08, endFrequency: 260, frequency: 740, gain: 0.07, release: 0.04, startTime, type: 'sawtooth' })
        break
      case 'magic_cast':
        ;[659, 880, 1175].forEach((frequency, index) => this.scheduleTone({ attack: 0.03, destination: sfxGain, duration: 0.24, endFrequency: frequency * 1.25, frequency, gain: 0.055, release: 0.15, startTime: startTime + index * 0.04, type: 'sine' }))
        break
      case 'defend_guard':
        this.scheduleTone({ destination: sfxGain, duration: 0.18, endFrequency: 180, frequency: 260, gain: 0.15, release: 0.08, startTime, type: 'square' })
        this.scheduleNoise({ destination: sfxGain, duration: 0.12, filterFrequency: 620, filterQ: 1.5, filterType: 'bandpass', gain: 0.12, release: 0.08, startTime: startTime + 0.02 })
        break
      case 'hit_physical':
        this.scheduleTone({
          destination: sfxGain,
          duration: 0.08,
          endFrequency: 55,
          frequency: 100,
          gain: 0.22,
          release: 0.06,
          startTime,
          type: 'sine',
        })
        this.scheduleNoise({
          destination: sfxGain,
          duration: 0.08,
          filterFrequency: 180,
          filterQ: 1.1,
          filterType: 'lowpass',
          gain: 0.18,
          release: 0.055,
          startTime,
        })
        break
      case 'hit_magical':
        ;[880, 1175, 1568, 2093].forEach((frequency, index) => {
          this.scheduleTone({
            destination: sfxGain,
            duration: 0.2,
            endFrequency: frequency * 1.18,
            frequency,
            gain: 0.055,
            release: 0.16,
            startTime: startTime + index * 0.012,
            type: 'sine',
          })
        })
        break
      case 'heal':
        this.scheduleTone({
          destination: sfxGain,
          duration: 0.3,
          endFrequency: 600,
          frequency: 200,
          gain: 0.16,
          release: 0.08,
          startTime,
          type: 'sine',
        })
        this.scheduleTone({
          destination: sfxGain,
          duration: 0.26,
          endFrequency: 900,
          frequency: 300,
          gain: 0.06,
          release: 0.08,
          startTime: startTime + 0.04,
          type: 'triangle',
        })
        break
      case 'impact_heavy':
        this.scheduleNoise({ destination: sfxGain, duration: 0.16, filterFrequency: 420, filterQ: 0.8, filterType: 'lowpass', gain: 0.25, release: 0.12, startTime })
        this.scheduleTone({ destination: sfxGain, duration: 0.18, endFrequency: 48, frequency: 110, gain: 0.18, release: 0.12, startTime, type: 'sine' })
        break
      case 'critical_flash':
        ;[1047, 1568, 2093].forEach((frequency, index) => this.scheduleTone({ destination: sfxGain, duration: 0.1, frequency, gain: 0.08, release: 0.06, startTime: startTime + index * 0.025, type: 'square' }))
        break
      case 'stagger_break':
        this.scheduleNoise({
          destination: sfxGain,
          duration: 0.2,
          filterFrequency: 900,
          filterQ: 0.9,
          filterType: 'lowpass',
          gain: 0.32,
          release: 0.16,
          startTime,
        })
        this.scheduleTone({
          destination: sfxGain,
          duration: 0.2,
          endFrequency: 45,
          frequency: 140,
          gain: 0.22,
          release: 0.14,
          startTime,
          type: 'square',
        })
        break
      case 'level_up':
        ;[262, 330, 392, 523].forEach((frequency, index) => {
          this.scheduleTone({
            destination: sfxGain,
            duration: 0.16,
            frequency,
            gain: 0.15,
            release: 0.04,
            startTime: startTime + index * 0.11,
            type: 'triangle',
          })
        })
        break
    }
  }

  playSFX(name: SfxName): void {
    this.playSfx(name)
  }

  playResonancePulse(mode: 'objective' | 'event' | 'reward' = 'event'): void {
    const context = this.ensureContext()

    if (!context || !this.sfxGain) {
      return
    }

    void this.resume()

    const startTime = context.currentTime + 0.01
    const root = mode === 'objective' ? 294 : mode === 'reward' ? 330 : 247
    const chord = [1, 1.5, 2, 3]
    chord.forEach((ratio, index) => {
      this.scheduleTone({
        attack: 0.018,
        destination: this.sfxGain as GainNode,
        duration: 0.58 + index * 0.07,
        endFrequency: root * ratio * 1.01,
        frequency: root * ratio,
        gain: 0.08 - index * 0.011,
        release: 0.38,
        startTime: startTime + index * 0.045,
        type: index === 0 ? 'triangle' : 'sine',
      })
    })
  }

  playTideBell(stage = 0): void {
    const context = this.ensureContext()

    if (!context || !this.sfxGain) {
      return
    }

    void this.resume()

    const startTime = context.currentTime + 0.01
    const base = 196 + tideBellStageOffset(stage)
    ;[1, 2.01, 2.72, 3.98].forEach((ratio, index) => {
      this.scheduleTone({
        attack: 0.004,
        destination: this.sfxGain as GainNode,
        duration: 1.2 - index * 0.14,
        frequency: base * ratio,
        gain: 0.09 - index * 0.014,
        release: 0.95,
        startTime: startTime + index * 0.035,
        type: 'sine',
      })
    })
  }

  async resume(): Promise<void> {
    const context = this.ensureContext()

    if (!context || context.state !== 'suspended') {
      return
    }

    await context.resume()

    if (this.context?.state === 'running') {
      this.unbindUnlockListeners()
    }
  }

  getCurrentMusic(): MusicTrack {
    return this.activeMusic?.track ?? null
  }

  getSettings(): AudioSettings {
    return { ...this.settings }
  }

  setMasterVolume(volume: number): void {
    this.settings.masterVolume = this.clampVolume(volume)
    this.applyVolumeSettings()
    this.saveSettings()
  }

  setMusicVolume(volume: number): void {
    this.settings.musicVolume = this.clampVolume(volume)
    this.applyVolumeSettings()
    this.saveSettings()
  }

  setSfxVolume(volume: number): void {
    this.settings.sfxVolume = this.clampVolume(volume)
    this.applyVolumeSettings()
    this.saveSettings()
  }

  private applyVolumeSettings(): void {
    const now = this.context?.currentTime ?? 0

    this.masterGain?.gain.setTargetAtTime(this.settings.masterVolume, now, 0.015)
    this.musicGain?.gain.setTargetAtTime(this.settings.musicVolume, now, 0.015)
    this.sfxGain?.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.015)
  }

  private bindUnlockListeners(): void {
    if (typeof window === 'undefined' || this.unlockListenersBound) {
      return
    }

    window.addEventListener('pointerdown', this.unlockAudio, { passive: true })
    window.addEventListener('keydown', this.unlockAudio)
    window.addEventListener('touchstart', this.unlockAudio, { passive: true })
    this.unlockListenersBound = true
  }

  private clampVolume(volume: number): number {
    if (!Number.isFinite(volume)) {
      return 0
    }

    return Math.min(1, Math.max(0, volume))
  }

  private connectEnvelope(
    gain: GainNode,
    startTime: number,
    duration: number,
    peakGain: number,
    attack = 0.005,
    release = 0.025,
  ): void {
    const attackEnd = startTime + Math.min(attack, duration * 0.45)
    const releaseStart = startTime + Math.max(0.001, duration - release)
    const endTime = startTime + duration

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.linearRampToValueAtTime(peakGain, attackEnd)
    gain.gain.setValueAtTime(peakGain, Math.max(attackEnd, releaseStart))
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime)
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const context = this.requireContext()
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration))
    const buffer = context.createBuffer(1, frameCount, context.sampleRate)
    const data = buffer.getChannelData(0)

    for (let index = 0; index < frameCount; index += 1) {
      data[index] = Math.random() * 2 - 1
    }

    return buffer
  }

  private createTitleDelay(destination: AudioNode, startTime: number): GainNode {
    const context = this.requireContext()
    const input = context.createGain()
    const delay = context.createDelay(1)
    const feedback = context.createGain()
    const wet = context.createGain()

    delay.delayTime.setValueAtTime(0.42, startTime)
    feedback.gain.setValueAtTime(0.26, startTime)
    wet.gain.setValueAtTime(0.24, startTime)

    input.connect(destination)
    input.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wet)
    wet.connect(destination)

    return input
  }

  private durationForTrack(track: ActiveMusicTrack): number {
    switch (track) {
      case 'title':
        return 30
      case 'town':
        return 20
      case 'dungeon':
        return 16
      case 'battle':
        return 12
      case 'boss':
        return 10
      case 'victory':
        return 3
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context) {
      return this.context
    }

    if (typeof window === 'undefined') {
      return null
    }

    const audioWindow = window as Window &
      typeof globalThis & {
        webkitAudioContext?: typeof AudioContext
      }
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext

    if (!AudioContextConstructor) {
      return null
    }

    const context = new AudioContextConstructor()
    const masterGain = context.createGain()
    const musicGain = context.createGain()
    const sfxGain = context.createGain()

    musicGain.connect(masterGain)
    sfxGain.connect(masterGain)
    masterGain.connect(context.destination)

    this.context = context
    this.masterGain = masterGain
    this.musicGain = musicGain
    this.sfxGain = sfxGain
    this.applyVolumeSettings()

    return context
  }

  private frequency(midiNote: number): number {
    return 440 * 2 ** ((midiNote - 69) / 12)
  }

  private loadSettings(): AudioSettings {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_SETTINGS }
    }

    try {
      const rawSettings = window.localStorage.getItem(SETTINGS_KEY)

      if (!rawSettings) {
        return { ...DEFAULT_SETTINGS }
      }

      const parsed = JSON.parse(rawSettings) as Partial<Record<keyof AudioSettings, unknown>>

      return {
        masterVolume:
          typeof parsed.masterVolume === 'number'
            ? this.clampVolume(parsed.masterVolume)
            : DEFAULT_SETTINGS.masterVolume,
        musicVolume:
          typeof parsed.musicVolume === 'number'
            ? this.clampVolume(parsed.musicVolume)
            : DEFAULT_SETTINGS.musicVolume,
        sfxVolume:
          typeof parsed.sfxVolume === 'number' ? this.clampVolume(parsed.sfxVolume) : DEFAULT_SETTINGS.sfxVolume,
      }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  private requireContext(): AudioContext {
    const context = this.ensureContext()

    if (!context) {
      throw new Error('AudioContext is not available in this environment.')
    }

    return context
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
    } catch {
      // Storage can be unavailable in private browsing or restricted embeds.
    }
  }

  private scheduleBattle(active: ActiveMusic, startTime: number): void {
    const bassPattern = [40, 40, 43, 40, 38, 40, 35, 40]
    const leadPattern = [52, 55, 59, 64, 59, 55, 52, 47]

    for (let step = 0; step < 48; step += 1) {
      const stepStart = startTime + step * 0.25
      const bassNote = bassPattern[step % bassPattern.length]

      this.scheduleTone({
        destination: active.gain,
        duration: 0.18,
        frequency: this.frequency(bassNote),
        gain: 0.08,
        nodes: active.nodes,
        release: 0.035,
        startTime: stepStart,
        type: 'square',
      })

      if (step % 2 === 0) {
        this.scheduleTone({
          destination: active.gain,
          duration: 0.16,
          frequency: this.frequency(leadPattern[(step / 2) % leadPattern.length]),
          gain: 0.045,
          nodes: active.nodes,
          release: 0.03,
          startTime: stepStart + 0.09,
          type: 'triangle',
        })
      }

      if (step % 4 === 0) {
        this.scheduleTone({
          destination: active.gain,
          duration: 0.12,
          endFrequency: 55,
          frequency: 120,
          gain: 0.15,
          nodes: active.nodes,
          release: 0.09,
          startTime: stepStart,
          type: 'sine',
        })
      }

      if (step % 8 === 4) {
        this.scheduleNoise({
          destination: active.gain,
          duration: 0.12,
          filterFrequency: 1200,
          filterQ: 0.7,
          filterType: 'bandpass',
          gain: 0.13,
          nodes: active.nodes,
          release: 0.08,
          startTime: stepStart,
        })
      }

      if (step % 2 === 1) {
        this.scheduleNoise({
          destination: active.gain,
          duration: 0.035,
          filterFrequency: 5000,
          filterQ: 0.6,
          filterType: 'highpass',
          gain: 0.045,
          nodes: active.nodes,
          release: 0.02,
          startTime: stepStart,
        })
      }
    }
  }

  private scheduleBoss(active: ActiveMusic, startTime: number): void {
    const arpeggio = [50, 53, 57, 62, 65, 62, 57, 53]
    const bass = [38, 38, 41, 38, 45, 43, 41, 36]

    for (let step = 0; step < 80; step += 1) {
      const stepStart = startTime + step * 0.125
      const note = arpeggio[step % arpeggio.length]

      this.scheduleTone({
        destination: active.gain,
        duration: 0.1,
        frequency: this.frequency(note),
        gain: 0.052,
        nodes: active.nodes,
        release: 0.02,
        startTime: stepStart,
        type: step % 2 === 0 ? 'square' : 'sawtooth',
      })

      if (step % 4 === 0) {
        const bassNote = bass[(step / 4) % bass.length]

        this.scheduleTone({
          destination: active.gain,
          duration: 0.32,
          frequency: this.frequency(bassNote),
          gain: 0.12,
          nodes: active.nodes,
          release: 0.08,
          startTime: stepStart,
          type: 'square',
        })
        this.scheduleTone({
          destination: active.gain,
          duration: 0.32,
          frequency: this.frequency(bassNote),
          gain: 0.05,
          nodes: active.nodes,
          release: 0.08,
          startTime: stepStart,
          type: 'sawtooth',
        })
      }

      if (step % 20 === 0) {
        this.scheduleNoise({
          destination: active.gain,
          duration: 0.24,
          filterFrequency: 850,
          filterQ: 0.5,
          filterType: 'lowpass',
          gain: 0.26,
          nodes: active.nodes,
          release: 0.18,
          startTime: stepStart,
        })
        this.scheduleTone({
          destination: active.gain,
          duration: 0.28,
          endFrequency: 45,
          frequency: 130,
          gain: 0.18,
          nodes: active.nodes,
          release: 0.2,
          startTime: stepStart,
          type: 'sine',
        })
      }
    }
  }

  private scheduleDungeon(active: ActiveMusic, startTime: number): void {
    const context = this.requireContext()
    const droneFilter = context.createBiquadFilter()
    const pingDelay = this.createTitleDelay(active.gain, startTime)

    droneFilter.type = 'lowpass'
    droneFilter.frequency.setValueAtTime(360, startTime)
    droneFilter.Q.setValueAtTime(1.6, startTime)
    droneFilter.connect(active.gain)

    ;[45, 52, 57].forEach((note, index) => {
      this.scheduleTone({
        attack: 1.2,
        destination: droneFilter,
        duration: 16,
        frequency: this.frequency(note),
        gain: 0.055 - index * 0.008,
        nodes: active.nodes,
        release: 1.8,
        startTime,
        type: 'sawtooth',
      })
    })

    ;[81, 84, 76, 88, 79].forEach((note, index) => {
      this.scheduleTone({
        attack: 0.004,
        destination: pingDelay,
        duration: 0.18,
        frequency: this.frequency(note),
        gain: 0.045,
        nodes: active.nodes,
        release: 0.15,
        startTime: startTime + 1.4 + index * 2.9,
        type: 'sine',
      })
    })
  }

  private scheduleMusicLoop(active: ActiveMusic, startTime: number): void {
    if (active.generation !== this.musicGeneration || this.activeMusic !== active) {
      return
    }

    switch (active.track) {
      case 'title':
        this.scheduleTitle(active, startTime)
        break
      case 'town':
        this.scheduleTown(active, startTime)
        break
      case 'dungeon':
        this.scheduleDungeon(active, startTime)
        break
      case 'battle':
        this.scheduleBattle(active, startTime)
        break
      case 'boss':
        this.scheduleBoss(active, startTime)
        break
      case 'victory':
        this.scheduleVictory(active, startTime)
        break
    }

    const duration = this.durationForTrack(active.track)

    if (active.track === 'victory') {
      active.timerId = window.setTimeout(() => {
        if (this.activeMusic === active) {
          this.activeMusic = null
        }

        active.gain.disconnect()
      }, (duration + FADE_SECONDS) * 1000)
      return
    }

    const context = this.requireContext()
    const nextStartTime = startTime + duration
    const scheduleInSeconds = Math.max(0.05, nextStartTime - context.currentTime - LOOP_LOOK_AHEAD_SECONDS)

    active.timerId = window.setTimeout(() => {
      this.scheduleMusicLoop(active, nextStartTime)
    }, scheduleInSeconds * 1000)
  }

  private scheduleNoise(options: NoiseOptions): AudioBufferSourceNode {
    const context = this.requireContext()
    const source = context.createBufferSource()
    const gain = context.createGain()
    const endTime = options.startTime + options.duration

    source.buffer = this.createNoiseBuffer(options.duration)
    this.connectEnvelope(gain, options.startTime, options.duration, options.gain, options.attack, options.release)

    if (options.filterType && options.filterFrequency) {
      const filter = context.createBiquadFilter()

      filter.type = options.filterType
      filter.frequency.setValueAtTime(options.filterFrequency, options.startTime)
      filter.Q.setValueAtTime(options.filterQ ?? 1, options.startTime)
      source.connect(filter)
      filter.connect(gain)
    } else {
      source.connect(gain)
    }

    gain.connect(options.destination)
    source.start(options.startTime)
    source.stop(endTime + 0.01)
    this.trackSource(source, options.nodes)

    return source
  }

  private scheduleTitle(active: ActiveMusic, startTime: number): void {
    const destination = this.createTitleDelay(active.gain, startTime)
    const chords = [
      [48, 55, 60, 63],
      [44, 51, 56, 60],
      [51, 58, 63, 67],
      [46, 53, 58, 62],
    ]

    chords.forEach((chord, chordIndex) => {
      const chordStart = startTime + chordIndex * 7.5

      chord.forEach((note, noteIndex) => {
        this.scheduleTone({
          attack: 1.5,
          destination,
          duration: 7.85,
          frequency: this.frequency(note),
          gain: 0.038 - noteIndex * 0.003,
          nodes: active.nodes,
          release: 1.4,
          startTime: chordStart,
          type: 'triangle',
        })
      })
    })

    ;[72, 75, 79, 82, 79, 75].forEach((note, index) => {
      this.scheduleTone({
        attack: 0.08,
        destination,
        duration: 1.9,
        frequency: this.frequency(note),
        gain: 0.027,
        nodes: active.nodes,
        release: 1.2,
        startTime: startTime + 2 + index * 4.6,
        type: 'triangle',
      })
    })
  }

  private scheduleTone(options: ToneOptions): OscillatorNode {
    const context = this.requireContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const endTime = options.startTime + options.duration

    oscillator.type = options.type ?? 'sine'
    oscillator.frequency.setValueAtTime(options.frequency, options.startTime)

    if (options.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, endTime)
    }

    this.connectEnvelope(gain, options.startTime, options.duration, options.gain, options.attack, options.release)

    oscillator.connect(gain)
    gain.connect(options.destination)
    oscillator.start(options.startTime)
    oscillator.stop(endTime + 0.01)
    this.trackSource(oscillator, options.nodes)

    return oscillator
  }

  private scheduleTown(active: ActiveMusic, startTime: number): void {
    const arpeggio = [55, 59, 62, 67, 62, 59, 57, 62]
    const bass = [43, 38, 40, 36]

    for (let step = 0; step < 40; step += 1) {
      this.scheduleTone({
        attack: 0.025,
        destination: active.gain,
        duration: 0.38,
        frequency: this.frequency(arpeggio[step % arpeggio.length]),
        gain: 0.052,
        nodes: active.nodes,
        release: 0.12,
        startTime: startTime + step * 0.5,
        type: 'sine',
      })
    }

    bass.forEach((note, index) => {
      this.scheduleTone({
        attack: 0.08,
        destination: active.gain,
        duration: 2.8,
        frequency: this.frequency(note),
        gain: 0.09,
        nodes: active.nodes,
        release: 0.7,
        startTime: startTime + index * 5,
        type: 'sine',
      })
    })
  }

  private scheduleVictory(active: ActiveMusic, startTime: number): void {
    const notes = [60, 64, 67, 72, 76, 79, 84]

    notes.forEach((note, index) => {
      this.scheduleTone({
        attack: 0.01,
        destination: active.gain,
        duration: index === notes.length - 1 ? 0.9 : 0.23,
        frequency: this.frequency(note),
        gain: index === notes.length - 1 ? 0.16 : 0.13,
        nodes: active.nodes,
        release: index === notes.length - 1 ? 0.45 : 0.06,
        startTime: startTime + index * 0.28,
        type: 'triangle',
      })
    })
  }

  private trackSource(source: AudioScheduledSourceNode, nodes?: AudioScheduledSourceNode[]): void {
    if (!nodes) {
      return
    }

    nodes.push(source)
    source.addEventListener('ended', () => {
      const index = nodes.indexOf(source)

      if (index !== -1) {
        nodes.splice(index, 1)
      }
    })
  }

  private unbindUnlockListeners(): void {
    if (typeof window === 'undefined' || !this.unlockListenersBound) {
      return
    }

    window.removeEventListener('pointerdown', this.unlockAudio)
    window.removeEventListener('keydown', this.unlockAudio)
    window.removeEventListener('touchstart', this.unlockAudio)
    this.unlockListenersBound = false
  }

  private readonly unlockAudio = (): void => {
    void this.resume()
  }
}

export const audioManager = new AudioManager()

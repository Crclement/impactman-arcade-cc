export class AudioManager {
  private sounds = new Map<string, HTMLAudioElement>()
  private music: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null
  private enabled = true

  async load(): Promise<void> {
    // Background music
    this.music = this.createAudio('/game-audio/GameSong.mp3', true)
    this.music.volume = 0.3

    // Sound effects
    const sfxFiles: Record<string, string> = {
      'start': '/game-audio/sfx/A1-Start_Game.wav',
      'die': '/game-audio/sfx/A3-Player_Die.wav',
      'egg': '/game-audio/sfx/A4-a-Impact_Egg_No_Donation.wav',
      'egg_time': '/game-audio/sfx/A5-Impact_Egg_Activated_Time.ogg',
      'ally': '/game-audio/sfx/A6-New_Ally.wav',
      'eat_trash': '/game-audio/sfx/B1-Eat_Trash.wav',
      'eat_ghost': '/game-audio/sfx/B3-Eat_Ghostnet.wav',
      'bonus': '/game-audio/Bonus.wav',
      'level_complete': '/game-audio/LevelComplete.wav',
      'pop': '/game-audio/Pop.mp3',
    }

    for (const [key, src] of Object.entries(sfxFiles)) {
      this.sounds.set(key, this.createAudio(src))
    }
  }

  private createAudio(src: string, loop = false): HTMLAudioElement {
    const audio = new Audio(src)
    audio.loop = loop
    audio.preload = 'auto'
    return audio
  }

  private ensureContext(): void {
    if (!this.audioContext) {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (AC) this.audioContext = new AC()
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  play(key: string): void {
    if (!this.enabled) return
    this.ensureContext()
    const sound = this.sounds.get(key)
    if (sound) {
      sound.currentTime = 0
      sound.play().catch(() => {})
    }
  }

  startMusic(): void {
    if (!this.enabled || !this.music) return
    this.ensureContext()
    this.music.play().catch(() => {})
  }

  stopMusic(): void {
    if (this.music) {
      this.music.pause()
      this.music.currentTime = 0
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stopMusic()
      this.sounds.forEach(s => { s.pause(); s.currentTime = 0 })
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  destroy(): void {
    this.stopMusic()
    this.sounds.forEach(s => { s.pause(); s.src = '' })
    this.sounds.clear()
    if (this.music) { this.music.src = '' }
    this.audioContext?.close()
  }
}

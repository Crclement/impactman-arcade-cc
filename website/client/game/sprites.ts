import type { Direction, GhostState, SpriteAnimation } from './types'

interface SpriteSet {
  [key: string]: HTMLImageElement[]
}

export class SpriteLoader {
  private sprites: SpriteSet = {}
  private loaded = false
  private mapBackground: HTMLImageElement[] = []  // Sea + Land + CentralTrash (below entities)
  private mapOverlay: HTMLImageElement[] = []     // Addons (above entities — tree tops)
  private menuBackground: HTMLImageElement | null = null
  private currentMapLevel = 0

  async load(): Promise<void> {
    const promises: Promise<void>[] = []

    // Ship sprites (4 directions × 4 frames)
    for (const dir of ['up', 'down', 'left', 'right']) {
      const key = `ship_${dir}`
      this.sprites[key] = []
      for (let i = 1; i <= 4; i++) {
        promises.push(this.loadImage(`/game-sprites/ship/${dir}/${i}.png`, key))
      }
    }

    // Ship dying sprites (4 directions × 4 frames)
    for (const dir of ['up', 'down', 'left', 'right']) {
      const key = `ship_dying_${dir}`
      this.sprites[key] = []
      for (let i = 1; i <= 4; i++) {
        promises.push(this.loadImage(`/game-sprites/ship/dying/${dir}/${i}.png`, key))
      }
    }

    // Ghost sprites (4 ghosts × 4 directions × 4 frames)
    for (let g = 1; g <= 4; g++) {
      for (const dir of ['up', 'down', 'left', 'right']) {
        const key = `ghost${g}_${dir}`
        this.sprites[key] = []
        for (let i = 1; i <= 4; i++) {
          promises.push(this.loadImage(`/game-sprites/ghosts/ghost${g}/${dir}/${i}.png`, key))
        }
      }
    }

    // Ghost eyes (4 directions × 4 frames)
    for (const dir of ['up', 'down', 'left', 'right']) {
      const key = `eyes_${dir}`
      this.sprites[key] = []
      for (let i = 1; i <= 4; i++) {
        promises.push(this.loadImage(`/game-sprites/ghosts/eyes/${dir}/${i}.png`, key))
      }
    }

    // Ghost vulnerable (4 directions × 4 frames)
    for (const dir of ['up', 'down', 'left', 'right']) {
      const key = `vulnerable_${dir}`
      this.sprites[key] = []
      for (let i = 1; i <= 4; i++) {
        promises.push(this.loadImage(`/game-sprites/ghosts/vulnerable/${dir}/${i}.png`, key))
      }
    }

    // Trash sprites (3 types × 4 frames)
    for (let t = 1; t <= 3; t++) {
      const key = `trash${t}`
      this.sprites[key] = []
      for (let i = 1; i <= 4; i++) {
        promises.push(this.loadImage(`/game-sprites/trash/trash${t}/${i}.png`, key))
      }
    }

    // Egg sprites (5 types × 4 frames)
    for (let e = 1; e <= 5; e++) {
      const key = `egg${e}`
      this.sprites[key] = []
      for (let i = 1; i <= 4; i++) {
        promises.push(this.loadImage(`/game-sprites/eggs/egg${e}/${i}.png`, key))
      }
    }

    // Load level 1 map layers by default
    promises.push(this.loadMapForLevel(1))

    // Menu background
    promises.push(this.loadMenuBackground('/game-sprites/menu/bg.jpg'))

    await Promise.all(promises)
    this.loaded = true
  }

  private loadImage(src: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.sprites[key].push(img)
        resolve()
      }
      img.onerror = () => {
        // Create a placeholder for missing sprites
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ff00ff'
        ctx.fillRect(0, 0, 32, 32)
        const placeholder = new Image()
        placeholder.src = canvas.toDataURL()
        placeholder.onload = () => {
          this.sprites[key].push(placeholder)
          resolve()
        }
      }
      img.src = src
    })
  }

  /** Load a single image, returning null on failure */
  private loadSingleImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => {
        console.warn(`[Sprites] Failed to load map layer: ${src}`)
        resolve(null)
      }
      img.src = src
    })
  }

  async loadMapForLevel(level: number): Promise<void> {
    if (level === this.currentMapLevel) return
    this.currentMapLevel = level
    this.mapBackground = []
    this.mapOverlay = []

    // Load all layers in parallel — Promise.all preserves input order,
    // guaranteeing: Sea (bottom) → Land (path borders) → CentralTrash (top)
    const bgFiles = [`M${level} - Sea.png`, `M${level} - Land.png`, 'CentralTrash.png']
    const [bgImages, overlay] = await Promise.all([
      Promise.all(bgFiles.map(f => this.loadSingleImage(`/game-sprites/maps/${f}`))),
      this.loadSingleImage(`/game-sprites/maps/M${level} - Addons.png`),
    ])

    // Add in guaranteed order (nulls filtered out for missing layers)
    for (const img of bgImages) {
      if (img) this.mapBackground.push(img)
    }
    if (overlay) this.mapOverlay.push(overlay)

    // Sanity check: warn if Land layer (path borders) is missing
    if (!bgImages[1]) {
      console.error(`[Sprites] MISSING: M${level} - Land.png — path borders will not render!`)
    }
    if (this.mapBackground.length < 2) {
      console.error(`[Sprites] Level ${level} map only has ${this.mapBackground.length} background layers (expected 3: Sea, Land, CentralTrash)`)
    }
  }

  private loadMenuBackground(src: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        this.menuBackground = img
        resolve()
      }
      img.onerror = () => resolve() // skip if missing
      img.src = src
    })
  }

  getMenuBackground(): HTMLImageElement | null {
    return this.menuBackground
  }

  getFrames(key: string): HTMLImageElement[] {
    return this.sprites[key] || []
  }

  getShipFrames(direction: Direction): HTMLImageElement[] {
    return this.getFrames(`ship_${direction}`)
  }

  getShipDyingFrames(direction: Direction): HTMLImageElement[] {
    return this.getFrames(`ship_dying_${direction}`)
  }

  getGhostFrames(ghostIndex: number, direction: Direction, state: GhostState): HTMLImageElement[] {
    if (state === 'dead') {
      return this.getFrames(`eyes_${direction}`)
    }
    if (state === 'frightened') {
      return this.getFrames(`vulnerable_${direction}`)
    }
    return this.getFrames(`ghost${ghostIndex + 1}_${direction}`)
  }

  getTrashFrames(trashType: number): HTMLImageElement[] {
    return this.getFrames(`trash${((trashType % 3) + 1)}`)
  }

  getEggFrames(eggIndex: number): HTMLImageElement[] {
    return this.getFrames(`egg${((eggIndex % 5) + 1)}`)
  }

  getMapBackground(): HTMLImageElement[] {
    return this.mapBackground
  }

  getMapOverlay(): HTMLImageElement[] {
    return this.mapOverlay
  }

  isLoaded(): boolean {
    return this.loaded
  }
}

export class AnimationController {
  private frameIndex = 0
  private elapsed = 0
  private frameDuration: number

  constructor(frameDuration = 150) {
    this.frameDuration = frameDuration
  }

  update(dt: number): void {
    this.elapsed += dt
    if (this.elapsed >= this.frameDuration) {
      this.elapsed -= this.frameDuration
      this.frameIndex++
    }
  }

  getFrame(frames: HTMLImageElement[]): HTMLImageElement | null {
    if (frames.length === 0) return null
    return frames[this.frameIndex % frames.length]
  }

  getFrameIndex(totalFrames: number): number {
    return this.frameIndex % totalFrames
  }

  reset(): void {
    this.frameIndex = 0
    this.elapsed = 0
  }
}

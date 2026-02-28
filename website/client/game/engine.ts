import type { GameScreen, GameEvents, LevelConfig, LevelData } from './types'
import {
  TILE_SIZE, INITIAL_LIVES, START_DELAY, EGG_PAUSE_DURATION,
  LEVEL_CONFIGS, CANVAS_WIDTH, CANVAS_HEIGHT,
} from './types'
import { Level } from './level'
import { Player } from './entities/player'
import { Ghost } from './entities/ghost'
import { CollectableManager } from './entities/collectable'
import { Renderer } from './renderer'
import { InputHandler } from './input'
import { SpriteLoader } from './sprites'
import { AudioManager } from './audio'
import level1Data from './levels/level1.json'
import level2Data from './levels/level2.json'
import level3Data from './levels/level3.json'
import level4Data from './levels/level4.json'
import level5Data from './levels/level5.json'
import level6Data from './levels/level6.json'
import level7Data from './levels/level7.json'

const LEVEL_DATA: LevelData[] = [
  level1Data as LevelData,
  level2Data as LevelData,
  level3Data as LevelData,
  level4Data as LevelData,
  level5Data as LevelData,
  level6Data as LevelData,
  level7Data as LevelData,
]

export class GameEngine {
  private canvas: HTMLCanvasElement
  private renderer!: Renderer
  private input: InputHandler
  private sprites: SpriteLoader
  private audio: AudioManager

  private level!: Level
  private player!: Player
  private ghosts: Ghost[] = []
  private collectables!: CollectableManager

  private screen: GameScreen = 'loading'
  private currentLevel = 1
  private lives = INITIAL_LIVES
  private events: Partial<GameEvents> = {}

  // Timing
  private lastTime = 0
  private animFrameId = 0
  private startDelayTimer = 0
  private eggPauseTimer = 0
  private deathAnimTimer = 0
  private ghostKillPauseTimer = 0
  private running = false
  private musicMuted = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.input = new InputHandler()
    this.sprites = new SpriteLoader()
    this.audio = new AudioManager()
    this.collectables = new CollectableManager()
  }

  async init(events: Partial<GameEvents>): Promise<void> {
    this.events = events

    // Size canvas to match the map images (896×992 = 28×31 tiles, with 1-tile border)
    this.canvas.width = CANVAS_WIDTH
    this.canvas.height = CANVAS_HEIGHT

    // Load assets
    await Promise.all([
      this.sprites.load(),
      this.audio.load(),
    ])

    this.renderer = new Renderer(this.canvas, this.sprites)
    this.input.init(window)

    this.setScreen('menu')
    // Render the menu background immediately
    this.renderer.renderMenu()
  }

  async startGame(): Promise<void> {
    if (this.screen !== 'menu') return

    this.currentLevel = 1
    this.lives = INITIAL_LIVES
    this.collectables.reset()

    await this.initLevel()
    this.setScreen('playing')
    this.emitAll()

    this.audio.startMusic()
    this.audio.play('start')

    // Start delay before movement
    this.startDelayTimer = START_DELAY

    // Start game loop
    if (!this.running) {
      this.running = true
      this.lastTime = performance.now()
      this.gameLoop(this.lastTime)
    }
  }

  private async initLevel(): Promise<void> {
    const data = this.getLevelData()
    this.level = new Level(data)

    // Load map images for this level
    await this.sprites.loadMapForLevel(this.currentLevel)
    this.renderer.invalidateMapCache()

    const config = this.getLevelConfig()
    this.player = new Player(data.playerSpawn, config.playerSpeedMultiplier)
    this.ghosts = data.ghostSpawns.map((spawn, i) => new Ghost(i, spawn, config, this.currentLevel))
  }

  private getLevelData(): LevelData {
    const idx = Math.min(this.currentLevel - 1, LEVEL_DATA.length - 1)
    return LEVEL_DATA[idx]
  }

  private getLevelConfig(): LevelConfig {
    const idx = Math.min(this.currentLevel - 1, LEVEL_CONFIGS.length - 1)
    return LEVEL_CONFIGS[idx]
  }

  private gameLoop = (timestamp: number): void => {
    if (!this.running) return

    const dt = Math.min(timestamp - this.lastTime, 50) // cap delta at 50ms
    this.lastTime = timestamp

    this.update(dt)
    this.render()

    this.animFrameId = requestAnimationFrame(this.gameLoop)
  }

  private update(dt: number): void {
    if (this.screen !== 'playing' && this.screen !== 'egg') return

    this.renderer.update(dt)

    // Handle egg pause
    if (this.screen === 'egg') {
      this.eggPauseTimer -= dt
      if (this.eggPauseTimer <= 0) {
        this.setScreen('playing')
        this.audio.play('egg_time') // Unity: EggTimerFX plays when frightened activates
      }
      return
    }

    // Handle start delay
    if (this.startDelayTimer > 0) {
      this.startDelayTimer -= dt
      return
    }

    // Handle death animation
    if (this.deathAnimTimer > 0) {
      this.deathAnimTimer -= dt
      if (this.deathAnimTimer <= 0) {
        this.onDeathAnimComplete()
      }
      return
    }

    // Handle ghost kill pause (0.3s freeze)
    if (this.ghostKillPauseTimer > 0) {
      this.ghostKillPauseTimer -= dt
      return
    }

    // Process input — consume immediately, no sticky buffering
    const bufferedDir = this.input.consumeBufferedDirection()
    if (bufferedDir) {
      this.player.setNextDirection(bufferedDir)
    }

    // Enable movement after start delay
    this.player.moving = true

    // Update player
    const result = this.player.update(dt, this.level)

    // Handle collections
    if (result.collected === 'trash') {
      const { score, bags, newBag } = this.collectables.collectTrash()
      this.events.onScoreChange?.(score)
      this.events.onBagsChange?.(bags)
      this.audio.play('eat_trash')

      // Check level complete
      if (this.level.isComplete()) {
        this.onLevelComplete()
        return
      }
    } else if (result.collected === 'egg') {
      const { score, eggBags } = this.collectables.collectEgg()
      this.events.onScoreChange?.(score)
      this.events.onEggBagsChange?.(eggBags)
      this.events.onBagsChange?.(this.collectables.getBags())
      this.audio.play('egg')

      // Trigger frightened mode on all ghosts
      const config = this.getLevelConfig()
      for (const ghost of this.ghosts) {
        ghost.startFrightened(config.frightenedDuration * 1000)
      }

      // Mute music during frightened (Unity behavior)
      this.audio.muteMusic()
      this.musicMuted = true

      // Pause for egg modal
      this.eggPauseTimer = EGG_PAUSE_DURATION
      this.setScreen('egg')

      // Check level complete
      if (this.level.isComplete()) {
        // Will complete after egg pause
        setTimeout(() => this.onLevelComplete(), EGG_PAUSE_DURATION)
        return
      }
      return
    }

    // Update ghosts
    for (const ghost of this.ghosts) {
      ghost.update(dt, this.level, this.player.gridPos, this.player.direction, true)
    }

    // Unmute music when frightened mode ends
    if (this.musicMuted && !this.ghosts.some(g => g.state === 'frightened')) {
      this.audio.unmuteMusic()
      this.musicMuted = false
    }

    // Check player-ghost collisions
    this.checkGhostCollisions()
  }

  private checkGhostCollisions(): void {
    for (const ghost of this.ghosts) {
      if (!this.player.isCollidingWith(ghost.gridPos)) continue

      if (ghost.state === 'frightened') {
        // Kill ghost — freeze gameplay for 0.3s
        ghost.kill()
        const { score, bags } = this.collectables.killGhost()
        this.events.onScoreChange?.(score)
        this.events.onBagsChange?.(bags)
        this.audio.play('eat_ghost')
        this.renderer.shake(300, 5)
        this.ghostKillPauseTimer = 300
      } else if (ghost.state === 'chase' || ghost.state === 'scatter') {
        // Player dies
        this.onPlayerDeath()
        return
      }
    }
  }

  private onPlayerDeath(): void {
    this.player.startDying()
    this.audio.play('die')
    this.audio.stopMusic()
    this.renderer.shake(1000, 10)
    this.deathAnimTimer = 2000 // 2s wait before retry (Unity: Invoke("Retry", 2f))

    // Freeze ghosts 0.1s after death (Unity: Invoke("StopGhosts", 0.1f))
    setTimeout(() => {
      for (const ghost of this.ghosts) {
        ghost.visible = false
      }
    }, 100)
  }

  private onDeathAnimComplete(): void {
    this.lives--
    this.events.onLivesChange?.(this.lives)

    if (this.lives <= 0) {
      this.setScreen('gameover')
      this.audio.stopMusic()
      this.running = false
      cancelAnimationFrame(this.animFrameId)
      return
    }

    // Reset positions but keep level state
    const data = this.getLevelData()
    const config = this.getLevelConfig()
    this.player.resetToSpawn(data.playerSpawn, config.playerSpeedMultiplier)
    for (const ghost of this.ghosts) {
      ghost.resetToSpawn(config, this.currentLevel)
    }

    this.audio.startMusic()
    this.audio.play('start')
    this.startDelayTimer = START_DELAY
  }

  private async onLevelComplete(): Promise<void> {
    this.audio.play('level_complete')
    this.currentLevel++
    this.events.onLevelChange?.(this.currentLevel)

    if (this.currentLevel > 7) {
      // Game won!
      this.setScreen('win')
      this.audio.stopMusic()
      this.running = false
      cancelAnimationFrame(this.animFrameId)
      return
    }

    // Load next level (new map + harder config)
    await this.initLevel()
    this.startDelayTimer = START_DELAY
    this.setScreen('playing')
  }

  private render(): void {
    if (!this.renderer) return
    if (this.screen === 'menu') {
      this.renderer.renderMenu()
      return
    }
    this.renderer.render(this.level, this.player, this.ghosts)
  }

  private setScreen(screen: GameScreen): void {
    this.screen = screen
    this.events.onScreenChange?.(screen)
  }

  private emitAll(): void {
    this.events.onScoreChange?.(this.collectables.getScore())
    this.events.onLivesChange?.(this.lives)
    this.events.onLevelChange?.(this.currentLevel)
    this.events.onBagsChange?.(this.collectables.getBags())
    this.events.onEggBagsChange?.(this.collectables.getEggBags())
  }

  // Public API for Vue integration

  getScreen(): GameScreen {
    return this.screen
  }

  setSound(enabled: boolean): void {
    this.audio.setEnabled(enabled)
    if (enabled && this.screen === 'playing') {
      this.audio.startMusic()
    }
  }

  sendMessage(message: string): void {
    try {
      const data = JSON.parse(message)
      if (data.Event === 'Sound') {
        this.setSound(data.Payload?.Enabled ?? true)
      }
    } catch {
      // ignore invalid messages
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  destroy(): void {
    this.running = false
    cancelAnimationFrame(this.animFrameId)
    this.input.destroy()
    this.audio.destroy()
  }

  // Dev: jump to a specific level
  async devSetLevel(level: number): Promise<void> {
    this.currentLevel = Math.max(1, Math.min(level, 7))
    this.lives = INITIAL_LIVES
    this.collectables.reset()

    await this.initLevel()
    this.setScreen('playing')
    this.emitAll()

    this.audio.startMusic()
    this.startDelayTimer = START_DELAY

    if (!this.running) {
      this.running = true
      this.lastTime = performance.now()
      this.gameLoop(this.lastTime)
    }
  }

  // Expose for focus management
  focus(): void {
    this.canvas.focus()
  }
}

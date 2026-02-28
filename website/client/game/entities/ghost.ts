import type { Direction, PixelPosition, Position, GhostState, LevelConfig } from '../types'
import { TILE_SIZE, GHOST_BASE_SPEED, FRIGHTENED_SPEED_MULT, DEAD_SPEED_MULT } from '../types'
import { findDirection, findPath, getRandomDirection } from '../pathfinding'
import type { Level } from '../level'

// Ghost targeting offsets (tiles ahead/behind player)
const GHOST_TARGET_OFFSETS = [20, -20, 0, 4]

// Ghost start delays in ms
const GHOST_START_DELAYS = [0, 1500, 3000, 3000]

export class Ghost {
  readonly ghostIndex: number
  gridPos: Position
  pixelPos: PixelPosition
  direction: Direction = 'up'
  state: GhostState = 'starting'
  visible = true
  frightenedTimer = 0

  private speed: number
  private baseSpeed: number
  private spawnPos: Position
  private targetPixel: PixelPosition
  private movingToTarget = false
  private startDelay: number
  private startTimer = 0

  // Scatter/chase timing
  private scatterTimer = 0
  private chaseTimer = 0
  private scatterCycles = 0
  private levelConfig: LevelConfig

  // Target offset for unique ghost behavior
  private targetOffset: number

  constructor(ghostIndex: number, spawn: Position, config: LevelConfig) {
    this.ghostIndex = ghostIndex
    this.spawnPos = { ...spawn }
    this.gridPos = { ...spawn }
    const pixel = gridToPixelCenter(spawn.x, spawn.y)
    this.pixelPos = { ...pixel }
    this.targetPixel = { ...pixel }
    this.levelConfig = config
    this.targetOffset = GHOST_TARGET_OFFSETS[ghostIndex] || 0
    this.startDelay = GHOST_START_DELAYS[ghostIndex] || 0
    this.baseSpeed = GHOST_BASE_SPEED * config.ghostSpeedMultiplier
    this.speed = this.baseSpeed
  }

  update(
    dt: number,
    level: Level,
    playerPos: Position,
    playerDir: Direction,
    moving: boolean
  ): void {
    if (!moving) return

    switch (this.state) {
      case 'starting':
        this.updateStarting(dt, level)
        break
      case 'scatter':
        this.updateScatter(dt, level, playerPos, playerDir)
        break
      case 'chase':
        this.updateChase(dt, level, playerPos, playerDir)
        break
      case 'frightened':
        this.updateFrightened(dt, level)
        break
      case 'dead':
        this.updateDead(dt, level)
        break
    }
  }

  private updateStarting(dt: number, level: Level): void {
    this.startTimer += dt
    if (this.startTimer >= this.startDelay) {
      // Exit ghost pen
      this.moveTowardPenExit(dt, level)

      // Check if at pen exit
      if (this.gridPos.x === level.ghostPenExit.x && this.gridPos.y === level.ghostPenExit.y) {
        this.state = 'scatter'
        this.scatterTimer = 0
        this.scatterCycles = 0
      } else if (this.startTimer >= this.startDelay + 3000) {
        // Force-exit if stuck
        this.gridPos = { ...level.ghostPenExit }
        const pixel = gridToPixelCenter(this.gridPos.x, this.gridPos.y)
        this.pixelPos = { ...pixel }
        this.targetPixel = { ...pixel }
        this.state = 'scatter'
        this.scatterTimer = 0
        this.scatterCycles = 0
      }
    }
  }

  private moveTowardPenExit(dt: number, level: Level): void {
    const exit = level.ghostPenExit
    const dir = findPath({ x: this.gridPos.x, y: this.gridPos.y }, exit, level)
    if (dir) {
      this.direction = dir
      this.moveInDirection(dt, level)
    }
  }

  private updateScatter(dt: number, level: Level, playerPos: Position, playerDir: Direction): void {
    this.scatterTimer += dt

    // Scatter target: corner of the maze based on ghost index
    const corners: Position[] = [
      { x: 0, y: 0 },                       // top-left
      { x: level.cols - 1, y: 0 },           // top-right
      { x: 0, y: level.rows - 1 },           // bottom-left
      { x: level.cols - 1, y: level.rows - 1 }, // bottom-right
    ]
    const target = corners[this.ghostIndex % 4]

    this.chaseTarget(dt, level, target)

    if (this.scatterTimer >= this.levelConfig.scatterDuration * 1000) {
      this.state = 'chase'
      this.chaseTimer = 0
    }
  }

  private updateChase(dt: number, level: Level, playerPos: Position, playerDir: Direction): void {
    this.chaseTimer += dt

    // Calculate target based on ghost personality
    const target = this.calculateChaseTarget(playerPos, playerDir, level)
    this.chaseTarget(dt, level, target)

    // Check berserker mode
    if (level.getRemainingCollectables() < 20) {
      this.speed = this.baseSpeed * 1.1
    }

    if (this.chaseTimer >= this.levelConfig.chaseDuration * 1000) {
      this.scatterCycles++
      if (this.scatterCycles < this.levelConfig.maxScatterCycles) {
        this.state = 'scatter'
        this.scatterTimer = 0
        this.speed = this.baseSpeed
      }
      // If max cycles reached, stay in chase permanently
    }
  }

  private calculateChaseTarget(playerPos: Position, playerDir: Direction, level: Level): Position {
    let tx = playerPos.x
    let ty = playerPos.y

    // Apply ghost-specific targeting
    switch (playerDir) {
      case 'up': ty -= this.targetOffset; break
      case 'down': ty += this.targetOffset; break
      case 'left': tx -= this.targetOffset; break
      case 'right': tx += this.targetOffset; break
    }

    // Clamp to grid bounds
    tx = Math.max(0, Math.min(level.cols - 1, tx))
    ty = Math.max(0, Math.min(level.rows - 1, ty))

    return { x: tx, y: ty }
  }

  private updateFrightened(dt: number, level: Level): void {
    this.frightenedTimer -= dt
    this.speed = this.baseSpeed * FRIGHTENED_SPEED_MULT

    // Move randomly at intersections
    if (this.isAtTileCenter()) {
      this.direction = getRandomDirection(this.gridPos, this.direction, level)
    }
    this.moveInDirection(dt, level)

    if (this.frightenedTimer <= 0) {
      this.state = 'chase'
      this.chaseTimer = 0
      this.speed = this.baseSpeed
    }
  }

  private updateDead(dt: number, level: Level): void {
    this.speed = this.baseSpeed * DEAD_SPEED_MULT

    // A* path back to ghost pen
    const dir = findPath(this.gridPos, level.ghostPenCenter, level)
    if (dir) {
      this.direction = dir
    }
    this.moveInDirection(dt, level)

    // Check if back at pen
    if (this.gridPos.x === level.ghostPenCenter.x && this.gridPos.y === level.ghostPenCenter.y) {
      this.state = 'starting'
      this.startTimer = this.startDelay // skip delay on respawn
      this.speed = this.baseSpeed
    }
  }

  private chaseTarget(dt: number, level: Level, target: Position): void {
    if (this.isAtTileCenter()) {
      this.direction = findDirection(this.gridPos, target, this.direction, level)
    }
    this.moveInDirection(dt, level)
  }

  private moveInDirection(dt: number, level: Level): void {
    const pixelSpeed = this.speed * TILE_SIZE * (dt / 1000)

    if (this.isAtTileCenter() && !this.movingToTarget) {
      const next = this.getNextTile(this.direction, level)
      if (next) {
        // Check for tunnel warp (target on opposite side of grid)
        const dx = Math.abs(next.x - this.gridPos.x)
        if (dx > 1) {
          // Tunnel — teleport instantly
          this.gridPos = { ...next }
          const center = gridToPixelCenter(next.x, next.y)
          this.pixelPos = { ...center }
          this.targetPixel = { ...center }
          this.movingToTarget = false
        } else {
          this.targetPixel = gridToPixelCenter(next.x, next.y)
          this.movingToTarget = true
        }
      }
    }

    if (this.movingToTarget) {
      const dx = this.targetPixel.x - this.pixelPos.x
      const dy = this.targetPixel.y - this.pixelPos.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= pixelSpeed) {
        // Snap to target grid position
        const arrived = pixelToGrid(this.targetPixel.x, this.targetPixel.y)
        this.gridPos = arrived
        const center = gridToPixelCenter(arrived.x, arrived.y)
        this.pixelPos = { ...center }
        this.targetPixel = { ...center }
        this.movingToTarget = false
      } else {
        this.pixelPos.x += (dx / dist) * pixelSpeed
        this.pixelPos.y += (dy / dist) * pixelSpeed
      }
    }
  }

  private getNextTile(dir: Direction, level: Level): Position | null {
    let nx = this.gridPos.x
    let ny = this.gridPos.y

    switch (dir) {
      case 'up': ny--; break
      case 'down': ny++; break
      case 'left': nx--; break
      case 'right': nx++; break
    }

    nx = level.wrapX(nx, ny)

    if (level.isWalkable(nx, ny)) {
      return { x: nx, y: ny }
    }
    return null
  }

  private isAtTileCenter(): boolean {
    const center = gridToPixelCenter(this.gridPos.x, this.gridPos.y)
    const dx = Math.abs(this.pixelPos.x - center.x)
    const dy = Math.abs(this.pixelPos.y - center.y)
    return dx < 2 && dy < 2
  }

  startFrightened(duration: number): void {
    if (this.state === 'dead' || this.state === 'starting') return
    this.state = 'frightened'
    this.frightenedTimer = duration
    this.speed = this.baseSpeed * FRIGHTENED_SPEED_MULT
    // Allow 180° turn when entering frightened
    this.direction = oppositeDir(this.direction)
  }

  kill(): void {
    this.state = 'dead'
    this.speed = this.baseSpeed * DEAD_SPEED_MULT
  }

  resetToSpawn(config: LevelConfig): void {
    this.gridPos = { ...this.spawnPos }
    const pixel = gridToPixelCenter(this.spawnPos.x, this.spawnPos.y)
    this.pixelPos = { ...pixel }
    this.targetPixel = { ...pixel }
    this.direction = 'up'
    this.state = 'starting'
    this.startTimer = 0
    this.movingToTarget = false
    this.scatterTimer = 0
    this.chaseTimer = 0
    this.scatterCycles = 0
    this.frightenedTimer = 0
    this.levelConfig = config
    this.baseSpeed = GHOST_BASE_SPEED * config.ghostSpeedMultiplier
    this.speed = this.baseSpeed
    this.visible = true
  }
}

function gridToPixelCenter(gx: number, gy: number): PixelPosition {
  return {
    x: gx * TILE_SIZE + TILE_SIZE / 2,
    y: gy * TILE_SIZE + TILE_SIZE / 2,
  }
}

function pixelToGrid(px: number, py: number): Position {
  return {
    x: Math.floor(px / TILE_SIZE),
    y: Math.floor(py / TILE_SIZE),
  }
}

function oppositeDir(dir: Direction): Direction {
  switch (dir) {
    case 'up': return 'down'
    case 'down': return 'up'
    case 'left': return 'right'
    case 'right': return 'left'
  }
}

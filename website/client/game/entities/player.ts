import type { Direction, PixelPosition, Position } from '../types'
import { TILE_SIZE, TILE_TRASH, TILE_EGG, BASE_SPEED } from '../types'
import type { Level } from '../level'

export class Player {
  gridPos: Position
  pixelPos: PixelPosition
  direction: Direction = 'right'
  private nextDirection: Direction | null = null
  speed: number
  moving = false
  visible = true
  dying = false

  // Movement: we move toward the center of the target tile
  private targetGridPos: Position | null = null
  private targetPixel: PixelPosition
  private movingToTarget = false

  constructor(spawn: Position, speedMultiplier: number) {
    this.gridPos = { ...spawn }
    const pixel = gridToPixelCenter(spawn.x, spawn.y)
    this.pixelPos = { ...pixel }
    this.targetPixel = { ...pixel }
    this.speed = BASE_SPEED * speedMultiplier
  }

  setNextDirection(dir: Direction): void {
    this.nextDirection = dir
  }

  update(dt: number, level: Level): { collected: 'trash' | 'egg' | null; position: Position } {
    if (!this.moving || this.dying) {
      return { collected: null, position: this.gridPos }
    }

    const pixelSpeed = this.speed * TILE_SIZE * (dt / 1000)
    let collected: 'trash' | 'egg' | null = null

    // Check if we can turn to the buffered direction — no sticky buffering
    if (this.nextDirection && this.isAtTileCenter()) {
      const nextPos = this.getNextTile(this.nextDirection, level)
      if (nextPos) {
        this.direction = this.nextDirection
        this.setTarget(nextPos, level)
      }
      // Always clear — if the turn can't happen now, discard it
      this.nextDirection = null
    }

    // If at tile center and no target, try to continue in current direction
    if (this.isAtTileCenter() && !this.movingToTarget) {
      const nextPos = this.getNextTile(this.direction, level)
      if (nextPos) {
        this.setTarget(nextPos, level)
      }
    }

    // Move toward target
    if (this.movingToTarget) {
      const dx = this.targetPixel.x - this.pixelPos.x
      const dy = this.targetPixel.y - this.pixelPos.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= pixelSpeed) {
        // Arrived at target tile — snap to it
        this.gridPos = { ...this.targetGridPos! }
        const center = gridToPixelCenter(this.gridPos.x, this.gridPos.y)
        this.pixelPos = { ...center }
        this.targetPixel = { ...center }
        this.movingToTarget = false
        this.targetGridPos = null

        // Collect item at new position
        const tile = level.collectAt(this.gridPos.x, this.gridPos.y)
        if (tile === TILE_TRASH) collected = 'trash'
        else if (tile === TILE_EGG) collected = 'egg'
      } else {
        // Move toward target
        this.pixelPos.x += (dx / dist) * pixelSpeed
        this.pixelPos.y += (dy / dist) * pixelSpeed
      }
    }

    return { collected, position: this.gridPos }
  }

  private isAtTileCenter(): boolean {
    const center = gridToPixelCenter(this.gridPos.x, this.gridPos.y)
    const dx = Math.abs(this.pixelPos.x - center.x)
    const dy = Math.abs(this.pixelPos.y - center.y)
    return dx < 2 && dy < 2
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

    // Handle tunnel wrapping
    nx = level.wrapX(nx, ny)

    if (level.isWalkable(nx, ny)) {
      return { x: nx, y: ny }
    }
    return null
  }

  private setTarget(pos: Position, level: Level): void {
    this.targetGridPos = { ...pos }

    // Check if this is a tunnel warp (target is on opposite side of grid)
    const dx = Math.abs(pos.x - this.gridPos.x)
    if (dx > 1) {
      // Tunnel wrap — teleport instantly to the other side
      this.gridPos = { ...pos }
      const center = gridToPixelCenter(pos.x, pos.y)
      this.pixelPos = { ...center }
      this.targetPixel = { ...center }
      this.movingToTarget = false
      this.targetGridPos = null

      // Collect at the warp destination
      level.collectAt(pos.x, pos.y)
    } else {
      // Normal movement — interpolate to target pixel
      this.targetPixel = gridToPixelCenter(pos.x, pos.y)
      this.movingToTarget = true
    }
  }

  resetToSpawn(spawn: Position, speedMultiplier: number): void {
    this.gridPos = { ...spawn }
    const pixel = gridToPixelCenter(spawn.x, spawn.y)
    this.pixelPos = { ...pixel }
    this.targetPixel = { ...pixel }
    this.direction = 'right'
    this.nextDirection = null
    this.speed = BASE_SPEED * speedMultiplier
    this.moving = false
    this.movingToTarget = false
    this.targetGridPos = null
    this.dying = false
    this.visible = true
  }

  startDying(): void {
    this.dying = true
    this.moving = false
    this.movingToTarget = false
  }

  // Check collision with a ghost (same tile)
  isCollidingWith(pos: Position): boolean {
    return this.gridPos.x === pos.x && this.gridPos.y === pos.y
  }
}

function gridToPixelCenter(gx: number, gy: number): PixelPosition {
  return {
    x: gx * TILE_SIZE + TILE_SIZE / 2,
    y: gy * TILE_SIZE + TILE_SIZE / 2,
  }
}

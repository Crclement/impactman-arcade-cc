import type { LevelData, Position, TileType } from './types'
import { TILE_WALL, TILE_EMPTY, TILE_TRASH, TILE_EGG } from './types'

export class Level {
  readonly cols: number
  readonly rows: number
  readonly tileSize: number
  readonly playerSpawn: Position
  readonly ghostSpawns: Position[]
  readonly ghostPenExit: Position
  readonly ghostPenCenter: Position
  readonly tunnelRows: number[]
  readonly eggs: Position[]

  // Mutable grid — collectables get removed during gameplay
  private grid: TileType[][]
  private totalCollectables: number
  private collectedCount: number

  constructor(data: LevelData) {
    this.cols = data.cols
    this.rows = data.rows
    this.tileSize = data.tileSize
    this.playerSpawn = { ...data.playerSpawn }
    this.ghostSpawns = data.ghostSpawns.map(s => ({ ...s }))
    this.ghostPenExit = { ...data.ghostPenExit }
    this.ghostPenCenter = { ...data.ghostPenCenter }
    this.tunnelRows = data.tunnelRows
    this.eggs = data.eggs.map(e => ({ ...e }))

    // Deep copy the grid
    this.grid = data.grid.map(row => [...row])

    // Count collectables
    this.totalCollectables = 0
    this.collectedCount = 0
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === TILE_TRASH || this.grid[y][x] === TILE_EGG) {
          this.totalCollectables++
        }
      }
    }
  }

  getTile(x: number, y: number): TileType {
    // Handle tunnel wrapping
    if (this.tunnelRows.includes(y)) {
      if (x < 0) x = this.cols - 1
      if (x >= this.cols) x = 0
    }
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return TILE_WALL
    return this.grid[y][x]
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y)
    return tile !== TILE_WALL
  }

  isGhostPen(x: number, y: number): boolean {
    // Ghost pen: the 4 spawn positions + the exit corridor
    for (const spawn of this.ghostSpawns) {
      if (spawn.x === x && spawn.y === y) return true
    }
    // The pen corridor (between spawns and exit)
    if (x === this.ghostPenExit.x || x === this.ghostPenExit.x + 1) {
      if (y >= this.ghostPenExit.y && y <= this.ghostPenCenter.y) return true
    }
    return false
  }

  collectAt(x: number, y: number): TileType {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return TILE_WALL
    const tile = this.grid[y][x]
    if (tile === TILE_TRASH || tile === TILE_EGG) {
      this.grid[y][x] = TILE_EMPTY
      this.collectedCount++
      return tile
    }
    return TILE_WALL
  }

  getRemainingCollectables(): number {
    return this.totalCollectables - this.collectedCount
  }

  getTotalCollectables(): number {
    return this.totalCollectables
  }

  isComplete(): boolean {
    return this.collectedCount >= this.totalCollectables
  }

  // Wrap tunnel position
  wrapX(x: number, y: number): number {
    if (!this.tunnelRows.includes(y)) return x
    if (x < 0) return this.cols - 1
    if (x >= this.cols) return 0
    return x
  }

  // Get pixel position from grid position (center of tile)
  gridToPixel(gx: number, gy: number): { x: number; y: number } {
    return {
      x: gx * this.tileSize + this.tileSize / 2,
      y: gy * this.tileSize + this.tileSize / 2,
    }
  }

  // Get grid position from pixel position
  pixelToGrid(px: number, py: number): Position {
    return {
      x: Math.floor(px / this.tileSize),
      y: Math.floor(py / this.tileSize),
    }
  }

  // Reset the grid to original state (for restarting)
  reset(data: LevelData): void {
    this.grid = data.grid.map(row => [...row])
    this.collectedCount = 0
    this.totalCollectables = 0
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === TILE_TRASH || this.grid[y][x] === TILE_EGG) {
          this.totalCollectables++
        }
      }
    }
  }
}

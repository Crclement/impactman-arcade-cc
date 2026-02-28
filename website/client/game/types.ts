// Tile types in the level grid
export const TILE_WALL = 0
export const TILE_EMPTY = 1 // walkable, no collectable
export const TILE_TRASH = 2
export const TILE_EGG = 3

export type TileType = typeof TILE_WALL | typeof TILE_EMPTY | typeof TILE_TRASH | typeof TILE_EGG

export type Direction = 'up' | 'down' | 'left' | 'right'
export type GameScreen = 'loading' | 'menu' | 'playing' | 'gameover' | 'win' | 'egg'

export type GhostState = 'starting' | 'chase' | 'scatter' | 'frightened' | 'dead'

export interface Position {
  x: number // grid column
  y: number // grid row
}

export interface PixelPosition {
  x: number
  y: number
}

export interface LevelData {
  cols: number
  rows: number
  tileSize: number
  grid: TileType[][]
  playerSpawn: Position
  ghostSpawns: Position[]
  ghostPenExit: Position   // where ghosts exit the pen (top of pen corridor)
  ghostPenCenter: Position // center of ghost pen
  tunnelRows: number[]     // row indices where tunnel wrapping occurs
  eggs: Position[]         // egg positions (subset of grid)
}

export interface GameEvents {
  onScoreChange: (score: number) => void
  onLivesChange: (lives: number) => void
  onLevelChange: (level: number) => void
  onScreenChange: (screen: GameScreen) => void
  onBagsChange: (bags: number) => void
  onEggBagsChange: (bags: number) => void
  onSoundEffect: (sfx: string) => void
}

export interface SpriteAnimation {
  frames: HTMLImageElement[]
  frameIndex: number
  frameDuration: number // ms per frame
  elapsed: number
}

export interface EntityBase {
  gridPos: Position       // current grid cell
  pixelPos: PixelPosition // smooth pixel position for rendering
  direction: Direction
  speed: number           // tiles per second
  moving: boolean
}

export interface LevelConfig {
  playerSpeedMultiplier: number
  ghostSpeedMultiplier: number
  scatterDuration: number   // seconds
  chaseDuration: number     // seconds
  maxScatterCycles: number
  frightenedDuration: number // seconds
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  // Level 1
  { playerSpeedMultiplier: 0.8, ghostSpeedMultiplier: 0.75, scatterDuration: 5, chaseDuration: 12, maxScatterCycles: 6, frightenedDuration: 6 },
  // Levels 2-3
  { playerSpeedMultiplier: 0.9, ghostSpeedMultiplier: 0.85, scatterDuration: 5, chaseDuration: 20, maxScatterCycles: 4, frightenedDuration: 5 },
  { playerSpeedMultiplier: 0.9, ghostSpeedMultiplier: 0.85, scatterDuration: 5, chaseDuration: 20, maxScatterCycles: 4, frightenedDuration: 5 },
  // Level 4+
  { playerSpeedMultiplier: 1.0, ghostSpeedMultiplier: 0.95, scatterDuration: 5, chaseDuration: 20, maxScatterCycles: 2, frightenedDuration: 4 },
]

export const BASE_SPEED = 7.5      // tiles per second (base player speed)
export const GHOST_BASE_SPEED = 7.5
export const TILE_SIZE = 32
// Map images are 896×992 = 28×31 tiles. Playable grid is 26×29, offset by 1 tile border.
export const GRID_OFFSET_X = 32   // 1 tile border on left
export const GRID_OFFSET_Y = 32   // 1 tile border on top
export const CANVAS_WIDTH = 896   // matches map image width
export const CANVAS_HEIGHT = 992  // matches map image height
// Sprite native sizes (from actual PNGs)
export const SHIP_SPRITE_SIZE = 64
export const GHOST_SPRITE_SIZE = 48
export const TRASH_SPRITE_SIZE = 20
export const EGG_SPRITE_SIZE = 72
export const SCORE_PER_TRASH = 4
export const SCORE_PER_EGG = 8
export const SCORE_PER_GHOST = 100
export const BAGS_PER_100_POINTS = 1
export const INITIAL_LIVES = 3
export const START_DELAY = 3000 // ms before movement starts
export const EGG_PAUSE_DURATION = 2100 // ms pause when egg collected
export const FRIGHTENED_SPEED_MULT = 0.5
export const DEAD_SPEED_MULT = 1.0

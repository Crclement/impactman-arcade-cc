import type { Direction, Position, GhostState } from './types'
import {
  TILE_TRASH, TILE_EGG, TILE_SIZE,
  GRID_OFFSET_X, GRID_OFFSET_Y,
  SHIP_SPRITE_SIZE, GHOST_SPRITE_SIZE, TRASH_SPRITE_SIZE, EGG_SPRITE_SIZE,
} from './types'
import type { Level } from './level'
import type { Player } from './entities/player'
import type { Ghost } from './entities/ghost'
import { SpriteLoader, AnimationController } from './sprites'

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private sprites: SpriteLoader
  private animController: AnimationController
  private shakeOffset = { x: 0, y: 0 }
  private shakeTime = 0
  private shakeDuration = 0
  private shakeMagnitude = 0

  // Pre-rendered map layers (cached)
  private bgCanvas: HTMLCanvasElement | null = null      // Sea + Land + CentralTrash (below entities)
  private overlayCanvas: HTMLCanvasElement | null = null  // Addons — tree tops (above entities)

  constructor(canvas: HTMLCanvasElement, sprites: SpriteLoader) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.sprites = sprites
    this.animController = new AnimationController(120)

    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false
  }

  update(dt: number): void {
    this.animController.update(dt)

    // Update camera shake
    if (this.shakeTime > 0) {
      this.shakeTime -= dt
      const progress = this.shakeTime / this.shakeDuration
      const magnitude = this.shakeMagnitude * progress
      this.shakeOffset.x = (Math.random() - 0.5) * magnitude * 2
      this.shakeOffset.y = (Math.random() - 0.5) * magnitude * 2
    } else {
      this.shakeOffset.x = 0
      this.shakeOffset.y = 0
    }
  }

  shake(duration: number, magnitude: number): void {
    this.shakeDuration = duration
    this.shakeTime = duration
    this.shakeMagnitude = magnitude
  }

  render(level: Level, player: Player, ghosts: Ghost[]): void {
    const ctx = this.ctx
    ctx.save()

    // Apply camera shake
    ctx.translate(this.shakeOffset.x, this.shakeOffset.y)

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20)

    // Layer 1: Sea + Land background (below everything)
    this.drawMapBackground()

    // Layer 2: Collectables
    this.drawCollectables(level)

    // Layer 3: Ghosts
    for (const ghost of ghosts) {
      this.drawGhost(ghost)
    }

    // Layer 4: Player
    this.drawPlayer(player)

    // Layer 5: Addons overlay — tree tops render ABOVE entities
    this.drawMapOverlay()

    ctx.restore()
  }

  /** Convert grid position to pixel position on canvas (accounting for border offset) */
  private gridToCanvas(gx: number, gy: number): { x: number; y: number } {
    return {
      x: GRID_OFFSET_X + gx * TILE_SIZE + TILE_SIZE / 2,
      y: GRID_OFFSET_Y + gy * TILE_SIZE + TILE_SIZE / 2,
    }
  }

  /** Convert entity pixel position (in grid-space) to canvas pixel position */
  private entityToCanvas(px: number, py: number): { x: number; y: number } {
    return {
      x: GRID_OFFSET_X + px,
      y: GRID_OFFSET_Y + py,
    }
  }

  private drawMapBackground(): void {
    const bgLayers = this.sprites.getMapBackground()

    if (bgLayers.length > 0) {
      if (!this.bgCanvas) {
        this.bgCanvas = document.createElement('canvas')
        this.bgCanvas.width = this.canvas.width
        this.bgCanvas.height = this.canvas.height
        const bgCtx = this.bgCanvas.getContext('2d')!
        bgCtx.imageSmoothingEnabled = false
        for (const layer of bgLayers) {
          bgCtx.drawImage(layer, 0, 0, this.canvas.width, this.canvas.height)
        }
      }
      this.ctx.drawImage(this.bgCanvas, 0, 0)
    }
  }

  private drawMapOverlay(): void {
    const overlayLayers = this.sprites.getMapOverlay()

    if (overlayLayers.length > 0) {
      if (!this.overlayCanvas) {
        this.overlayCanvas = document.createElement('canvas')
        this.overlayCanvas.width = this.canvas.width
        this.overlayCanvas.height = this.canvas.height
        const ovCtx = this.overlayCanvas.getContext('2d')!
        ovCtx.imageSmoothingEnabled = false
        for (const layer of overlayLayers) {
          ovCtx.drawImage(layer, 0, 0, this.canvas.width, this.canvas.height)
        }
      }
      this.ctx.drawImage(this.overlayCanvas, 0, 0)
    }
  }

  private drawCollectables(level: Level): void {
    const ctx = this.ctx
    const frameIdx = this.animController.getFrameIndex(4)

    for (let y = 0; y < level.rows; y++) {
      for (let x = 0; x < level.cols; x++) {
        const tile = level.getTile(x, y)
        // Center of tile on canvas
        const cx = GRID_OFFSET_X + x * TILE_SIZE + TILE_SIZE / 2
        const cy = GRID_OFFSET_Y + y * TILE_SIZE + TILE_SIZE / 2

        if (tile === TILE_TRASH) {
          // All trash uses the same sprite (Trash1), rendered at native 16×16, centered
          const frames = this.sprites.getTrashFrames(0) // always trash1
          if (frames.length > 0) {
            const frame = frames[frameIdx % frames.length]
            ctx.drawImage(
              frame,
              cx - TRASH_SPRITE_SIZE / 2,
              cy - TRASH_SPRITE_SIZE / 2,
              TRASH_SPRITE_SIZE,
              TRASH_SPRITE_SIZE,
            )
          } else {
            // Fallback dot
            ctx.fillStyle = '#c8e8f0'
            ctx.beginPath()
            ctx.arc(cx, cy, 3, 0, Math.PI * 2)
            ctx.fill()
          }
        } else if (tile === TILE_EGG) {
          // Eggs rendered at native 48×48, centered
          const eggIdx = level.eggs.findIndex(e => e.x === x && e.y === y)
          const frames = this.sprites.getEggFrames(eggIdx >= 0 ? eggIdx : 0)
          if (frames.length > 0) {
            const frame = frames[frameIdx % frames.length]
            ctx.drawImage(
              frame,
              cx - EGG_SPRITE_SIZE / 2,
              cy - EGG_SPRITE_SIZE / 2,
              EGG_SPRITE_SIZE,
              EGG_SPRITE_SIZE,
            )
          } else {
            ctx.fillStyle = '#ff6b6b'
            ctx.beginPath()
            ctx.arc(cx, cy, 10, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }
  }

  private drawPlayer(player: Player): void {
    if (!player.visible) return

    const ctx = this.ctx
    const pos = this.entityToCanvas(player.pixelPos.x, player.pixelPos.y)

    let frames: HTMLImageElement[]
    if (player.dying) {
      frames = this.sprites.getShipDyingFrames(player.direction)
    } else {
      frames = this.sprites.getShipFrames(player.direction)
    }

    const frame = this.animController.getFrame(frames)
    if (frame) {
      // Ship renders at native 48×48, centered on position
      ctx.drawImage(
        frame,
        pos.x - SHIP_SPRITE_SIZE / 2,
        pos.y - SHIP_SPRITE_SIZE / 2,
        SHIP_SPRITE_SIZE,
        SHIP_SPRITE_SIZE,
      )
    } else {
      ctx.fillStyle = '#ffdd57'
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, SHIP_SPRITE_SIZE / 2 - 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawGhost(ghost: Ghost): void {
    if (!ghost.visible) return

    const ctx = this.ctx
    const pos = this.entityToCanvas(ghost.pixelPos.x, ghost.pixelPos.y)

    const frames = this.sprites.getGhostFrames(ghost.ghostIndex, ghost.direction, ghost.state)
    const frame = this.animController.getFrame(frames)

    if (frame) {
      // Flash effect when frightened is about to end
      if (ghost.state === 'frightened' && ghost.frightenedTimer < 2000) {
        const flashOn = Math.floor(ghost.frightenedTimer / 200) % 2 === 0
        if (flashOn) {
          ctx.globalAlpha = 0.6
        }
      }

      // Ghosts render at 44×44, centered on position
      ctx.drawImage(
        frame,
        pos.x - GHOST_SPRITE_SIZE / 2,
        pos.y - GHOST_SPRITE_SIZE / 2,
        GHOST_SPRITE_SIZE,
        GHOST_SPRITE_SIZE,
      )
      ctx.globalAlpha = 1
    } else {
      const colors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852']
      ctx.fillStyle = ghost.state === 'frightened' ? '#2121ff' : colors[ghost.ghostIndex % 4]
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, GHOST_SPRITE_SIZE / 2 - 2, 0, Math.PI * 2)
      ctx.fill()

      if (ghost.state === 'dead') {
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(pos.x - 4, pos.y - 2, 3, 0, Math.PI * 2)
        ctx.arc(pos.x + 4, pos.y - 2, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  renderMenu(): void {
    const ctx = this.ctx
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const menuBg = this.sprites.getMenuBackground()
    if (menuBg) {
      // Menu bg is 896×1044, canvas is 896×992 — scale to fit width, crop bottom
      const scale = this.canvas.width / menuBg.width
      const drawHeight = menuBg.height * scale
      ctx.drawImage(menuBg, 0, 0, this.canvas.width, drawHeight)
    }
  }

  invalidateMapCache(): void {
    this.bgCanvas = null
    this.overlayCanvas = null
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }
}

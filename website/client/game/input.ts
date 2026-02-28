import type { Direction } from './types'

export class InputHandler {
  private currentDirection: Direction | null = null
  private bufferedDirection: Direction | null = null
  private keyState = new Map<string, boolean>()
  private startPressed = false
  private onCleanup: (() => void) | null = null

  init(target: HTMLElement | Window = window) {
    const onKeyDown = (e: Event) => {
      const ke = e as KeyboardEvent
      const dir = this.keyToDirection(ke.code)
      if (dir) {
        ke.preventDefault()
        this.keyState.set(ke.code, true)
        this.bufferedDirection = dir
      }
      if (ke.code === 'Space' || ke.code === 'Enter') {
        ke.preventDefault()
        this.startPressed = true
      }
    }

    const onKeyUp = (e: Event) => {
      const ke = e as KeyboardEvent
      this.keyState.set(ke.code, false)
    }

    target.addEventListener('keydown', onKeyDown)
    target.addEventListener('keyup', onKeyUp)

    this.onCleanup = () => {
      target.removeEventListener('keydown', onKeyDown)
      target.removeEventListener('keyup', onKeyUp)
    }
  }

  private keyToDirection(code: string): Direction | null {
    switch (code) {
      case 'ArrowUp': case 'KeyW': return 'up'
      case 'ArrowDown': case 'KeyS': return 'down'
      case 'ArrowLeft': case 'KeyA': return 'left'
      case 'ArrowRight': case 'KeyD': return 'right'
      default: return null
    }
  }

  getBufferedDirection(): Direction | null {
    return this.bufferedDirection
  }

  consumeBufferedDirection(): Direction | null {
    const dir = this.bufferedDirection
    this.bufferedDirection = null
    return dir
  }

  consumeStart(): boolean {
    const pressed = this.startPressed
    this.startPressed = false
    return pressed
  }

  reset() {
    this.currentDirection = null
    this.bufferedDirection = null
    this.startPressed = false
    this.keyState.clear()
  }

  destroy() {
    this.onCleanup?.()
    this.onCleanup = null
  }
}

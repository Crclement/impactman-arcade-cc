import type { Position, Direction } from './types'
import type { Level } from './level'

interface PathNode {
  x: number
  y: number
  g: number // cost from start
  h: number // heuristic (manhattan distance to goal)
  f: number // g + h
  parent: PathNode | null
}

const DIRECTIONS: { dir: Direction; dx: number; dy: number }[] = [
  { dir: 'up', dx: 0, dy: -1 },
  { dir: 'down', dx: 0, dy: 1 },
  { dir: 'left', dx: -1, dy: 0 },
  { dir: 'right', dx: 1, dy: 0 },
]

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function oppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'up': return 'down'
    case 'down': return 'up'
    case 'left': return 'right'
    case 'right': return 'left'
  }
}

/**
 * A* pathfinding to find the best direction to move toward target.
 * Returns the direction to take from the current position.
 * Ghosts cannot reverse direction (except when entering frightened mode).
 */
export function findDirection(
  from: Position,
  target: Position,
  currentDirection: Direction,
  level: Level,
  allowReverse = false
): Direction {
  // If already at target, no movement needed
  if (from.x === target.x && from.y === target.y) return currentDirection

  // Try each valid direction and pick the one that leads closest to target
  // This is the simpler "greedy" approach the Unity ghosts actually use
  const opposite = oppositeDirection(currentDirection)
  let bestDir: Direction = currentDirection
  let bestDist = Infinity

  for (const { dir, dx, dy } of DIRECTIONS) {
    // No 180° turns unless allowed
    if (!allowReverse && dir === opposite) continue

    let nx = from.x + dx
    let ny = from.y + dy

    // Handle tunnel wrapping
    nx = level.wrapX(nx, ny)

    if (!level.isWalkable(nx, ny)) continue

    const dist = manhattan({ x: nx, y: ny }, target)
    if (dist < bestDist) {
      bestDist = dist
      bestDir = dir
    }
  }

  return bestDir
}

/**
 * Full A* pathfinding — used for dead ghosts returning to pen.
 * Returns the first direction to move in the optimal path.
 */
export function findPath(
  from: Position,
  target: Position,
  level: Level
): Direction | null {
  if (from.x === target.x && from.y === target.y) return null

  const openSet: PathNode[] = []
  const closedSet = new Set<string>()

  const startNode: PathNode = {
    x: from.x,
    y: from.y,
    g: 0,
    h: manhattan(from, target),
    f: manhattan(from, target),
    parent: null,
  }
  openSet.push(startNode)

  const key = (x: number, y: number) => `${x},${y}`

  while (openSet.length > 0) {
    // Find node with lowest f cost
    let lowestIdx = 0
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIdx].f) lowestIdx = i
    }
    const current = openSet.splice(lowestIdx, 1)[0]

    if (current.x === target.x && current.y === target.y) {
      // Trace back to find the first step
      let node = current
      while (node.parent && node.parent.parent) {
        node = node.parent
      }
      // node is now the first step from start
      const dx = node.x - from.x
      const dy = node.y - from.y
      if (dx === 1 || (dx < -1)) return 'right' // tunnel wrap
      if (dx === -1 || (dx > 1)) return 'left'   // tunnel wrap
      if (dy === -1) return 'up'
      if (dy === 1) return 'down'
      return null
    }

    closedSet.add(key(current.x, current.y))

    for (const { dx, dy } of DIRECTIONS) {
      let nx = current.x + dx
      let ny = current.y + dy
      nx = level.wrapX(nx, ny)

      if (!level.isWalkable(nx, ny)) continue
      if (closedSet.has(key(nx, ny))) continue

      const g = current.g + 1
      const h = manhattan({ x: nx, y: ny }, target)
      const f = g + h

      const existing = openSet.find(n => n.x === nx && n.y === ny)
      if (existing) {
        if (g < existing.g) {
          existing.g = g
          existing.f = f
          existing.parent = current
        }
      } else {
        openSet.push({ x: nx, y: ny, g, h, f, parent: current })
      }
    }

    // Safety: prevent infinite loops on large grids
    if (closedSet.size > 1000) break
  }

  // No path found — fall back to greedy direction
  return findDirection(from, target, 'up', level, true)
}

/**
 * Get a random valid direction at an intersection (for frightened ghosts)
 */
export function getRandomDirection(
  from: Position,
  currentDirection: Direction,
  level: Level,
  allowReverse = false
): Direction {
  const opposite = oppositeDirection(currentDirection)
  const validDirs: Direction[] = []

  for (const { dir, dx, dy } of DIRECTIONS) {
    if (!allowReverse && dir === opposite) continue
    let nx = from.x + dx
    let ny = from.y + dy
    nx = level.wrapX(nx, ny)
    if (level.isWalkable(nx, ny)) {
      validDirs.push(dir)
    }
  }

  if (validDirs.length === 0) return currentDirection
  return validDirs[Math.floor(Math.random() * validDirs.length)]
}

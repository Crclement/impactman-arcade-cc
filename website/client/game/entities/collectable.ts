import type { Position } from '../types'
import { SCORE_PER_TRASH, SCORE_PER_GHOST, BAGS_PER_100_POINTS } from '../types'

export class CollectableManager {
  private score = 0
  private bags = 0
  private eggBags = 0
  private lastBagMilestone = 0 // track when we last awarded a bag
  private ghostKillStreak = 0  // consecutive ghost kills in a single egg

  reset(): void {
    this.score = 0
    this.bags = 0
    this.eggBags = 0
    this.lastBagMilestone = 0
    this.ghostKillStreak = 0
  }

  collectTrash(): { score: number; bags: number; newBag: boolean } {
    this.score += SCORE_PER_TRASH
    let newBag = false

    // Award a bag every 100 points
    const newMilestone = Math.floor(this.score / 100)
    if (newMilestone > this.lastBagMilestone) {
      const bagsToAdd = newMilestone - this.lastBagMilestone
      this.bags += bagsToAdd
      this.lastBagMilestone = newMilestone
      newBag = true
    }

    return { score: this.score, bags: this.bags, newBag }
  }

  collectEgg(): { eggBags: number } {
    // Egg awards random 6-12 bags
    const bonus = 6 + Math.floor(Math.random() * 7)
    this.eggBags += bonus
    this.bags += bonus
    this.ghostKillStreak = 0
    return { eggBags: this.eggBags }
  }

  killGhost(): { score: number; bags: number; newBag: boolean } {
    this.ghostKillStreak++
    const points = SCORE_PER_GHOST * this.ghostKillStreak
    this.score += points
    let newBag = false

    const newMilestone = Math.floor(this.score / 100)
    if (newMilestone > this.lastBagMilestone) {
      const bagsToAdd = newMilestone - this.lastBagMilestone
      this.bags += bagsToAdd
      this.lastBagMilestone = newMilestone
      newBag = true
    }

    return { score: this.score, bags: this.bags, newBag }
  }

  resetGhostStreak(): void {
    this.ghostKillStreak = 0
  }

  getScore(): number { return this.score }
  getBags(): number { return this.bags }
  getEggBags(): number { return this.eggBags }
}

import { SCORE_PER_TRASH, SCORE_PER_EGG, SCORE_PER_GHOST } from '../types'

export class CollectableManager {
  private score = 0
  private bags = 0
  private eggBags = 0
  private lastBagMilestone = 0 // track when we last awarded a bag

  reset(): void {
    this.score = 0
    this.bags = 0
    this.eggBags = 0
    this.lastBagMilestone = 0
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

  collectEgg(): { score: number; eggBags: number } {
    // Egg awards 8 points + random 6-12 bags
    this.score += SCORE_PER_EGG
    const bonus = 6 + Math.floor(Math.random() * 7)
    this.eggBags += bonus
    this.bags += bonus

    const newMilestone = Math.floor(this.score / 100)
    if (newMilestone > this.lastBagMilestone) {
      const bagsToAdd = newMilestone - this.lastBagMilestone
      this.bags += bagsToAdd
      this.lastBagMilestone = newMilestone
    }

    return { score: this.score, eggBags: this.eggBags }
  }

  killGhost(): { score: number; bags: number; newBag: boolean } {
    this.score += SCORE_PER_GHOST
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

  getScore(): number { return this.score }
  getBags(): number { return this.bags }
  getEggBags(): number { return this.eggBags }
}

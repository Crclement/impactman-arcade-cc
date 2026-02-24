import { defineStore } from 'pinia'
import { User } from './auth'

export interface GameStore {
  sound: boolean,
  global: GameGlobalValues,
  leaderboard: GameScore[],
  allies: string[],
  unityInstance?: any
}

export interface GameScore {
  user: Partial<User>,
  score: number
}

export type GamePossibleScreens = "loading" | "menu" | "playing" | "gameover" | "win" | "egg"

export interface GameGlobalValues {
  currentScore: number
  currentLevel: number
  currentLives: number
  currentBags: number
  eggBags: number
  gameScreen: GamePossibleScreens
}

export const useGameStore = defineStore('game', {
  state: (): GameStore => ({
    sound: true,
    global: {
      currentScore: 0,
      currentLives: 0,
      currentBags: 0,
      eggBags: 8,
      currentLevel: 1,
      gameScreen: "loading"
    },
    leaderboard: [],
    unityInstance: null,
    allies: []
  }),
  actions: {
    SendMessage(message: string){
      console.log('Sending message', message, this.unityInstance)
      this.unityInstance.SendMessage("GameManager", "OnWebMessage", message)
    },
    StartGame(){
      this.unityInstance.SendMessage("StartManager", "LoadGame")
    }
  },
  getters: {
    ticketsEarned(): string {
      return (this.global.currentScore * 0.01).toFixed(0)
    }
  }
})
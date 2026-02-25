import { defineStore } from 'pinia'
import { User } from './auth'

export interface LoggedInUser {
  id: string,
  name: string,
  email: string,
  totalScore?: number,
  totalBags?: number,
  gamesPlayed?: number,
}

export interface GameStore {
  sound: boolean,
  global: GameGlobalValues,
  leaderboard: GameScore[],
  allies: string[],
  unityInstance?: any,
  loggedInUser: LoggedInUser | null,
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
    allies: [],
    loggedInUser: null,
  }),
  actions: {
    loadUser() {
      if (process.client) {
        const saved = localStorage.getItem('impactarcade_user')
        if (saved) {
          try {
            this.loggedInUser = JSON.parse(saved)
          } catch (e) {
            console.error('Failed to parse saved user:', e)
          }
        }
      }
    },
    clearUser() {
      this.loggedInUser = null
      if (process.client) {
        localStorage.removeItem('impactarcade_user')
        localStorage.removeItem('impactarcade_token')
      }
    },
    SendMessage(message: string){
      console.log('Sending message', message, this.unityInstance)
      this.unityInstance.SendMessage("GameManager", "OnWebMessage", message)
    },
    StartGame(){
      this.unityInstance.SendMessage("StartManager", "LoadGame")
      // Focus canvas for keyboard input (important for arcade cabinet)
      setTimeout(() => {
        const canvas = document.getElementById('unity-canvas')
        if (canvas) canvas.focus()
      }, 100)
    }
  },
  getters: {
    ticketsEarned(): string {
      return (this.global.currentScore * 0.01).toFixed(0)
    }
  }
})
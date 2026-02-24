import { defineStore } from 'pinia'

export interface AuthStore {
  token: string,
  user: User | null
}

export interface User {
  id: number,
  name: string,
  email: string
}

export const useAuth = defineStore('auth', {
  state: (): AuthStore => ({
    token: '',
    user: null
  })
})
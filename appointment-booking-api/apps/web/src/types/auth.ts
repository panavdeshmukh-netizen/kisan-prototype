export type UserRole = 'client' | 'provider' | 'farmer'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  created_at?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: User
  }
}

export interface RegisterResponse {
  success: boolean
  message: string
  data: {
    user: User
  }
}

export interface ProfileResponse {
  success: boolean
  message: string
  data: {
    user: User
  }
}

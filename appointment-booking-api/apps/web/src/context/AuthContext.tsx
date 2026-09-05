import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../types/auth'
import { api } from '../lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    role: 'client' | 'provider',
  ) => Promise<void>
  logout: () => void
  updateUser: (updatedUser: Partial<User>) => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  )
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        try {
          const profile = await api.users.getProfile()
          setUser(profile.data.user)
          localStorage.setItem('user', JSON.stringify(profile.data.user))
        } catch {
          // Token invalid or expired
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password })
    const { token: jwtToken, user: authUser } = response.data
    localStorage.setItem('token', jwtToken)
    localStorage.setItem('user', JSON.stringify(authUser))
    setToken(jwtToken)
    setUser(authUser)
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'client' | 'provider',
  ) => {
    await api.auth.register({ name, email, password, role })
    await login(email, password)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedFields }
      setUser(newUser)
      localStorage.setItem('user', JSON.stringify(newUser))
    }
  }

  const refreshProfile = async () => {
    try {
      const profile = await api.users.getProfile()
      setUser(profile.data.user)
      localStorage.setItem('user', JSON.stringify(profile.data.user))
    } catch (err) {
      console.error('Failed to refresh profile', err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

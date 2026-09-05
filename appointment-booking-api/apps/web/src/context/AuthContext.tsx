import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../types/auth'
import { api } from '../lib/api'
import { demoService } from '../lib/demo'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isDemoMode: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    role: 'client' | 'provider' | 'farmer',
    phone?: string,
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
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        // Check if it's a demo token — skip network call
        if (demoService.isDemoToken(storedToken)) {
          const profile = demoService.getProfile(storedToken)
          if (profile) {
            setUser(profile as User)
            setIsDemoMode(true)
          } else {
            // Demo token invalid, clear it
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setToken(null)
            setUser(null)
          }
        } else {
          // Try real API
          try {
            const profile = await api.users.getProfile()
            setUser(profile.data.user)
            setIsDemoMode(false)
            localStorage.setItem('user', JSON.stringify(profile.data.user))
          } catch {
            // Real API failed; fall back to demo profile if available
            const demoProfile = demoService.getProfile(storedToken)
            if (demoProfile) {
              setUser(demoProfile as User)
              setIsDemoMode(true)
            } else {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              setToken(null)
              setUser(null)
            }
          }
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    // 1. Try the real backend first
    try {
      const response = await api.auth.login({ email, password })
      const { token: jwtToken, user: authUser } = response.data
      localStorage.setItem('token', jwtToken)
      localStorage.setItem('user', JSON.stringify(authUser))
      setToken(jwtToken)
      setUser(authUser)
      setIsDemoMode(false)
      return
    } catch (realErr: any) {
      // Only fall back to demo if the error is a network/connection error
      // (i.e. backend is down). If it's a 401, throw proper auth error.
      const isNetworkError =
        !realErr.response ||
        realErr.code === 'ERR_NETWORK' ||
        realErr.code === 'ECONNREFUSED' ||
        realErr.message === 'Network Error' ||
        realErr.message?.toLowerCase().includes('failed to fetch')

      if (!isNetworkError) {
        // Real server responded with an error (e.g. 401 wrong password)
        throw realErr
      }
    }

    // 2. Backend unavailable → use demo service
    const { token: demoToken, user: demoUser } = demoService.login(email, password)
    localStorage.setItem('token', demoToken)
    localStorage.setItem('user', JSON.stringify(demoUser))
    setToken(demoToken)
    setUser(demoUser as User)
    setIsDemoMode(true)
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'client' | 'provider' | 'farmer',
    phone?: string,
  ) => {
    try {
      await api.auth.register({ name, email, password, role })
      await login(email, password)
      return
    } catch (realErr: any) {
      const isNetworkError =
        !realErr.response ||
        realErr.code === 'ERR_NETWORK' ||
        realErr.message === 'Network Error' ||
        realErr.message?.toLowerCase().includes('failed to fetch')

      if (!isNetworkError) {
        throw realErr
      }
    }

    // Demo fallback
    demoService.register({ name, email, password, role, phone })
    const { token: demoToken, user: demoUser } = demoService.login(email, password)
    localStorage.setItem('token', demoToken)
    localStorage.setItem('user', JSON.stringify(demoUser))
    setToken(demoToken)
    setUser(demoUser as User)
    setIsDemoMode(true)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setIsDemoMode(false)
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
      const storedToken = localStorage.getItem('token')
      if (storedToken && demoService.isDemoToken(storedToken)) {
        const profile = demoService.getProfile(storedToken)
        if (profile) {
          setUser(profile as User)
        }
        return
      }
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
        isDemoMode,
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

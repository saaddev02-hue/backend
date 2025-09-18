import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string
  role: string
  isEmailVerified: boolean
  lastLogin?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      authAPI.setToken(token)
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await authAPI.getCurrentUser()
      if (response.data.success && response.data.data.user.role === 'admin') {
        setUser(response.data.data.user)
      } else {
        localStorage.removeItem('adminToken')
        authAPI.setToken('')
      }
    } catch (error) {
      localStorage.removeItem('adminToken')
      authAPI.setToken('')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password)
    if (response.data.success && response.data.data.user.role === 'admin') {
      const { token, user } = response.data.data
      localStorage.setItem('adminToken', token)
      authAPI.setToken(token)
      setUser(user)
    } else {
      throw new Error('Admin access required')
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    authAPI.setToken('')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
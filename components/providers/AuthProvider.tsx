'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: any
  staff: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [staff, setStaff] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('holykids_admin_user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setStaff(userData)
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Simple auth - in production, use proper authentication
    if (email === 'admin@holykids.edu' && password === 'admin123') {
      const adminUser = { email, role: 'Super Admin' }
      localStorage.setItem('holykids_admin_user', JSON.stringify(adminUser))
      setUser(adminUser)
      setStaff(adminUser)
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const signOut = () => {
    localStorage.removeItem('holykids_admin_user')
    setUser(null)
    setStaff(null)
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider value={{ user, staff, loading, signIn, signOut }}>
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

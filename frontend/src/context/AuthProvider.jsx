import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context'
import { loginApi, registerApi } from '../api/auth.api'
import { TOKEN_KEY, USER_KEY } from '../api/client'

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export default function AuthProvider({ children }) {
  // Initial values come from localStorage so a page refresh keeps you logged in
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // The axios interceptor fires this when the backend returns 401
  useEffect(() => {
    window.addEventListener('auth:logout', clearSession)
    return () => window.removeEventListener('auth:logout', clearSession)
  }, [clearSession])

  const login = useCallback(async (email, password) => {
    const data = await loginApi(email, password)
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback((payload) => registerApi(payload), [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'ADMIN',
      // same rule as the backend's requireAccess('CREATE')
      canCreate: user?.role === 'ADMIN' || user?.access === 'CREATE',
      login,
      register,
      logout: clearSession,
    }),
    [user, token, login, register, clearSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
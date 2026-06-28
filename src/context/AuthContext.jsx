import { createContext, useContext, useMemo, useState } from 'react'

const AUTH_KEY = 'calc-auth-user'
const TOKEN_KEY = 'calc-auth-token'
// In dev, use relative URLs so Vite proxies /api to the backend (avoids CORS).
const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? '' : 'http://localhost:5000')

const AuthContext = createContext(null)

function loadUser() {
  try {
    const saved = localStorage.getItem(AUTH_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function loadToken() {
  return localStorage.getItem(TOKEN_KEY)
}

async function parseResponse(response) {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)
  const [token, setToken] = useState(loadToken)

  const saveSession = (sessionUser, sessionToken) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(sessionUser))
    localStorage.setItem(TOKEN_KEY, sessionToken)
    setUser(sessionUser)
    setToken(sessionToken)
  }

  const login = async (email, password) => {
    const data = await parseResponse(
      await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }),
    )

    saveSession(data.user, data.token)
  }

  const register = async (name, email, password) => {
    const data = await parseResponse(
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      }),
    )

    saveSession(data.user, data.token)
  }

  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    setToken(null)
  }

  const verifyCalculatorAccess = async () => {
    if (!token) {
      throw new Error('Not authenticated')
    }

    return parseResponse(
      await fetch(`${API_URL}/api/calculator`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )
  }

  const value = useMemo(
    () => ({ user, token, login, register, logout, verifyCalculatorAccess }),
    [user, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

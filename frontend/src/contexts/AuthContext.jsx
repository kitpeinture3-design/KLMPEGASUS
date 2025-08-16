import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
            setToken(storedToken)
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            setToken(null)
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          setToken(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setToken(data.tokens.accessToken)
        localStorage.setItem('token', data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.tokens.refreshToken)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setToken(data.tokens.accessToken)
        localStorage.setItem('token', data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.tokens.refreshToken)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.message || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }
  }

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken')
      if (!storedRefreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.tokens.accessToken)
        localStorage.setItem('token', data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.tokens.refreshToken)
        return data.tokens.accessToken
      } else {
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return null
    }
  }

  // API helper function with automatic token refresh
  const apiCall = async (url, options = {}) => {
    const makeRequest = async (authToken) => {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      })
    }

    let response = await makeRequest(token)

    // If unauthorized, try to refresh token
    if (response.status === 401 && token) {
      const newToken = await refreshToken()
      if (newToken) {
        response = await makeRequest(newToken)
      }
    }

    return response
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshToken,
    apiCall,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


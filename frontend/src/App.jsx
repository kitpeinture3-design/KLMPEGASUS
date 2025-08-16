import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

// Import components
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import Dashboard from './components/Dashboard'
import SiteBuilder from './components/SiteBuilder'
import OnboardingChat from './components/OnboardingChat'

// Context for authentication
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/" />
}

// Landing Page component
const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  const openAuth = (mode = 'login') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar onAuthClick={openAuth} />
      
      <main>
        <Hero onGetStarted={() => openAuth('register')} />
        <Features />
        <Pricing onGetStarted={() => openAuth('register')} />
      </main>
      
      <Footer />
      
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            mode={authMode}
            onClose={() => setShowAuthModal(false)}
            onSwitchMode={setAuthMode}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Main App component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <OnboardingChat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/builder/:siteId?" 
              element={
                <ProtectedRoute>
                  <SiteBuilder />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App


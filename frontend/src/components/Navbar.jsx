import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, Zap, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Navbar = ({ onAuthClick }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)

  const features = [
    { name: 'Constructeur IA', description: 'Créez des sites avec l\'IA en minutes' },
    { name: 'Branding Intelligent', description: 'Génération automatique de logos et couleurs' },
    { name: 'E-commerce Intégré', description: 'Traitement des paiements intégré' },
    { name: 'SEO Optimisé', description: 'Classement supérieur sur les moteurs de recherche' },
  ]

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              KLM Pegasus
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div 
              className="relative"
              onMouseEnter={() => setShowFeatures(true)}
              onMouseLeave={() => setShowFeatures(false)}
            >
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
                <span>Fonctionnalités</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showFeatures && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4"
                >
                  <div className="grid grid-cols-1 gap-4">
                    {features.map((feature, index) => (
                      <div key={index} className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
            
            <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">
              Tarifs
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">
              À propos
            </a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => onAuthClick('login')}
              className="text-gray-700 hover:text-blue-600"
            >
              Se connecter
            </Button>
            <Button 
              onClick={() => onAuthClick('register')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Commencer Gratuitement
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t border-gray-200"
        >
          <div className="px-4 py-6 space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Features</h3>
              {features.map((feature, index) => (
                <div key={index} className="pl-4">
                  <h4 className="font-medium text-gray-700">{feature.name}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
            
            <a href="#pricing" className="block text-gray-700 hover:text-blue-600 transition-colors">
              Pricing
            </a>
            <a href="#about" className="block text-gray-700 hover:text-blue-600 transition-colors">
              About
            </a>
            <a href="#contact" className="block text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </a>
            
            <div className="pt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onAuthClick('login')}
              >
                Sign In
              </Button>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => onAuthClick('register')}
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  )
}

export default Navbar


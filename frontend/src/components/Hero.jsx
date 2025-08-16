import { motion } from 'framer-motion'
import { ArrowRight, Play, Sparkles, Zap, Globe, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Hero = ({ onGetStarted }) => {
  const stats = [
    { icon: Globe, value: '10K+', label: 'Sites Créés' },
    { icon: TrendingUp, value: '300%', label: 'Plus Rapide' },
    { icon: Zap, value: '99.9%', label: 'Disponibilité' },
  ]

  const floatingElements = [
    { icon: Sparkles, delay: 0, x: 100, y: 50 },
    { icon: Zap, delay: 0.5, x: -80, y: 80 },
    { icon: Globe, delay: 1, x: 120, y: -60 },
  ]

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      
      {/* Floating background elements */}
      {floatingElements.map((element, index) => (
        <motion.div
          key={index}
          className="absolute opacity-10"
          style={{ left: `${50 + element.x}px`, top: `${200 + element.y}px` }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <element.icon className="h-16 w-16 text-blue-600" />
        </motion.div>
      ))}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Propulsé par une Technologie IA Avancée
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
          >
            Créez des{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sites
            </span>
            <br />
            E-commerce{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              en Minutes
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            KLM Pegasus utilise une IA révolutionnaire pour construire, concevoir et optimiser votre boutique en ligne automatiquement. 
            Plus puissant que Shopify, plus simple que Squarespace, et 10x plus rapide que les constructeurs traditionnels.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Commencer Gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-all duration-300"
            >
              <Play className="mr-2 h-5 w-5" />
              Voir la Démo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm"
              >
                <stat.icon className="h-8 w-8 text-blue-600 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 text-center"
          >
            <p className="text-gray-500 text-sm mb-6">Fait confiance par des entrepreneurs du monde entier</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              {/* Placeholder for company logos */}
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}

export default Hero


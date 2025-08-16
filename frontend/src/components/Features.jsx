import { motion } from 'framer-motion'
import { 
  Brain, 
  Palette, 
  ShoppingCart, 
  Search, 
  Smartphone, 
  BarChart3,
  Zap,
  Globe,
  Shield,
  Rocket,
  MessageSquare,
  CreditCard
} from 'lucide-react'

const Features = () => {
  const mainFeatures = [
    {
      icon: Brain,
      title: 'Génération de Site par IA',
      description: 'Notre IA avancée analyse votre entreprise et crée un site e-commerce complet en minutes, pas en semaines.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Palette,
      title: 'Branding et Design Intelligents',
      description: 'Génère automatiquement des logos, palettes de couleurs et mises en page qui correspondent parfaitement à votre identité de marque.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: ShoppingCart,
      title: 'Suite E-commerce Complète',
      description: 'Gestion d\'inventaire intégrée, traitement des commandes et analyses clients - tout ce dont vous avez besoin pour vendre en ligne.',
      color: 'from-green-500 to-emerald-500'
    }
  ]

  const additionalFeatures = [
    {
      icon: Search,
      title: 'Optimisation SEO',
      description: 'Optimisation SEO automatique pour un meilleur classement sur les moteurs de recherche'
    },
    {
      icon: Smartphone,
      title: 'Design Mobile-First',
      description: 'Design responsive parfait qui fonctionne parfaitement sur tous les appareils'
    },
    {
      icon: BarChart3,
      title: 'Analyses Avancées',
      description: 'Insights en temps réel et recommandations alimentées par l\'IA'
    },
    {
      icon: Zap,
      title: 'Ultra Rapide',
      description: 'Optimisé pour la vitesse avec CDN global et mise en cache'
    },
    {
      icon: Globe,
      title: 'Support Multi-langues',
      description: 'Atteignez les marchés mondiaux avec traduction automatique'
    },
    {
      icon: Shield,
      title: 'Sécurité Entreprise',
      description: 'Sécurité de niveau bancaire avec SSL et protection contre la fraude'
    },
    {
      icon: Rocket,
      title: 'Déploiement en Un Clic',
      description: 'Déployez votre site instantanément avec support de domaine personnalisé'
    },
    {
      icon: MessageSquare,
      title: 'Support Client IA',
      description: 'Chatbot intelligent gère les demandes clients 24h/24 et 7j/7'
    },
    {
      icon: CreditCard,
      title: 'Traitement des Paiements',
      description: 'Acceptez les paiements dans le monde entier avec intégration Stripe'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Tout ce dont vous avez besoin pour{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dominer
            </span>{' '}
            l'E-commerce
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            KLM Pegasus combine une IA de pointe avec des outils e-commerce puissants pour vous donner 
            un avantage déloyal sur vos concurrents.
          </p>
        </motion.div>

        {/* Main features */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20"
        >
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative group"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300">
                {/* Icon with gradient background */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-3xl font-bold mb-4">
              Prêt à Découvrir l'Avenir de l'E-commerce ?
            </h3>
            <p className="text-xl opacity-90 mb-6">
              Rejoignez des milliers d'entrepreneurs qui ont déjà fait le changement vers le commerce alimenté par l'IA.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300"
            >
              Commencer Votre Essai Gratuit
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Features


import { motion } from 'framer-motion'
import { Check, Star, Zap, Crown, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Pricing = ({ onGetStarted }) => {
  const plans = [
    {
      name: 'Basique',
      icon: Zap,
      price: '19',
      period: 'mois',
      description: 'Parfait pour les entrepreneurs individuels et petites entreprises',
      popular: false,
      features: [
        '1 site web généré par IA',
        'Configuration e-commerce complète',
        'Branding et design IA',
        'Design responsive mobile',
        'Certificat SSL inclus',
        'Analyses de base',
        'Support par email',
        'Traitement des paiements (Stripe)',
        'Optimisation SEO',
        'Domaine personnalisé (1ère année gratuite)'
      ],
      limitations: [
        'Jusqu\'à 100 produits',
        '1GB de stockage',
        'Templates de base'
      ]
    },
    {
      name: 'Premium',
      icon: Star,
      price: '49',
      period: 'mois',
      description: 'Pour les entreprises en croissance qui ont besoin de fonctionnalités avancées',
      popular: true,
      features: [
        'Tout ce qui est dans Basique',
        'Jusqu\'à 5 sites web',
        'Outils marketing IA avancés',
        'Support multi-langues',
        'Analyses et insights avancés',
        'Support prioritaire (24h/24 7j/7)',
        'Intégrations personnalisées',
        'Outils de test A/B',
        'Fonctionnalités SEO avancées',
        'Intégration réseaux sociaux',
        'Gestion d\'inventaire',
        'Segmentation client'
      ],
      limitations: [
        'Jusqu\'à 1 000 produits',
        '10GB de stockage',
        'Templates premium'
      ]
    },
    {
      name: 'Entreprise',
      icon: Crown,
      price: 'Sur mesure',
      period: 'nous contacter',
      description: 'Pour les grandes entreprises et agences avec des besoins personnalisés',
      popular: false,
      features: [
        'Tout ce qui est dans Premium',
        'Sites web illimités',
        'Solution en marque blanche',
        'Formation IA personnalisée',
        'Gestionnaire de compte dédié',
        'Intégrations personnalisées',
        'Fonctionnalités de sécurité avancées',
        'Garantie SLA',
        'Développement personnalisé',
        'Collaboration multi-équipes',
        'Rapports avancés',
        'Accès API'
      ],
      limitations: [
        'Produits illimités',
        'Stockage illimité',
        'Templates personnalisés'
      ]
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const cardVariants = {
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
    <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Tarification Simple et{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Transparente
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choisissez le plan parfait pour votre entreprise. Tous les plans incluent notre technologie IA révolutionnaire 
            et sont accompagnés d'une garantie de remboursement de 30 jours.
          </p>
          
          {/* Pricing toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md">
              Mensuel
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
              Annuel (Économisez 20%)
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                plan.popular 
                  ? 'border-blue-500 shadow-2xl' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Le Plus Populaire
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex p-3 rounded-2xl mb-4 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                      : 'bg-gray-100'
                  }`}>
                    <plan.icon className={`h-8 w-8 ${
                      plan.popular ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === 'Sur mesure' ? (
                      <div className="text-4xl font-bold text-gray-900">
                        Sur mesure
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center">
                        <span className="text-5xl font-bold text-gray-900">
                          €{plan.price}
                        </span>
                        <span className="text-gray-600 ml-2">
                          /{plan.period}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={onGetStarted}
                    className={`w-full py-3 text-lg font-semibold rounded-xl transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {plan.price === 'Sur mesure' ? 'Contacter les Ventes' : 'Commencer l\'Essai Gratuit'}
                  </Button>
                </div>

                {/* Features list */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-lg">
                    Ce qui est inclus :
                  </h4>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations */}
                  <div className="pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Limites du plan :
                    </h5>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="text-sm text-gray-600">
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Questions Fréquemment Posées
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">
                Puis-je changer de plan à tout moment ?
              </h4>
              <p className="text-gray-600">
                Oui, vous pouvez mettre à niveau ou rétrograder votre plan à tout moment. Les changements prennent effet immédiatement.
              </p>
            </div>
            
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">
                Y a-t-il un essai gratuit ?
              </h4>
              <p className="text-gray-600">
                Oui, tous les plans sont accompagnés d'un essai gratuit de 14 jours. Aucune carte de crédit requise pour commencer.
              </p>
            </div>
            
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">
                Quels modes de paiement acceptez-vous ?
              </h4>
              <p className="text-gray-600">
                Nous acceptons toutes les principales cartes de crédit, PayPal et les virements bancaires pour les plans Entreprise.
              </p>
            </div>
            
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">
                Offrez-vous des remboursements ?
              </h4>
              <p className="text-gray-600">
                Oui, nous offrons une garantie de remboursement de 30 jours sur tous les plans. Sans questions posées.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Pricing


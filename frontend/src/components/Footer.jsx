import { motion } from 'framer-motion'
import { Zap, Mail, Phone, MapPin, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react'

const Footer = () => {
  const footerLinks = {
    Product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Templates', href: '#' },
      { name: 'Integrations', href: '#' },
      { name: 'API', href: '#' }
    ],
    Company: [
      { name: 'About Us', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Partners', href: '#' }
    ],
    Support: [
      { name: 'Help Center', href: '#' },
      { name: 'Documentation', href: '#' },
      { name: 'Community', href: '#' },
      { name: 'Contact Us', href: '#' },
      { name: 'Status', href: '#' }
    ],
    Legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'GDPR', href: '#' },
      { name: 'Security', href: '#' }
    ]
  }

  const socialLinks = [
    { icon: Twitter, href: '#', name: 'Twitter' },
    { icon: Facebook, href: '#', name: 'Facebook' },
    { icon: Instagram, href: '#', name: 'Instagram' },
    { icon: Linkedin, href: '#', name: 'LinkedIn' }
  ]

  const contactInfo = [
    { icon: Mail, text: 'hello@klmpegasus.com' },
    { icon: Phone, text: '+33 1 23 45 67 89' },
    { icon: MapPin, text: 'Paris, France' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Company info */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {/* Logo */}
                <div className="flex items-center space-x-2 mb-6">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">KLM Pegasus</span>
                </div>

                <p className="text-gray-400 mb-6 leading-relaxed">
                  Revolutionizing e-commerce with AI-powered website creation. 
                  Build stunning online stores in minutes, not months.
                </p>

                {/* Contact info */}
                <div className="space-y-3">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <item.icon className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400 text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Links sections */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {Object.entries(footerLinks).map(([category, links], index) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <h3 className="text-lg font-semibold mb-4">{category}</h3>
                    <ul className="space-y-3">
                      {links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <a
                            href={link.href}
                            className="text-gray-400 hover:text-white transition-colors duration-200"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border-t border-gray-800 py-12"
        >
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              Stay Updated with KLM Pegasus
            </h3>
            <p className="text-gray-400 mb-6">
              Get the latest updates on new features, AI improvements, and e-commerce insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              />
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300">
                Subscribe
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border-t border-gray-800 py-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              © 2024 KLM Pegasus. All rights reserved.
            </div>

            {/* Social links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5 text-gray-400 hover:text-white" />
                </a>
              ))}
            </div>

            {/* Additional links */}
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                Sitemap
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Accessibility
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer


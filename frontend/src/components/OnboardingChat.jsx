import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const OnboardingChat = () => {
  const [messages, setMessages] = useState([])
  const [currentInput, setCurrentInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [userResponses, setUserResponses] = useState({})
  const messagesEndRef = useRef(null)

  const onboardingSteps = [
    {
      id: 'welcome',
      question: "Hi! I'm your AI assistant. I'll help you create an amazing e-commerce website in just a few minutes. What's your name?",
      type: 'text',
      key: 'name'
    },
    {
      id: 'business_name',
      question: "Nice to meet you, {name}! What's the name of your business or the website you want to create?",
      type: 'text',
      key: 'businessName'
    },
    {
      id: 'industry',
      question: "Great! What industry are you in? This helps me understand your target audience better.",
      type: 'select',
      key: 'industry',
      options: [
        'Fashion & Apparel',
        'Electronics & Technology',
        'Health & Beauty',
        'Home & Garden',
        'Sports & Fitness',
        'Food & Beverage',
        'Books & Media',
        'Jewelry & Accessories',
        'Art & Crafts',
        'Other'
      ]
    },
    {
      id: 'target_audience',
      question: "Who is your target audience? For example: 'Young professionals aged 25-35' or 'Eco-conscious families'",
      type: 'text',
      key: 'targetAudience'
    },
    {
      id: 'products',
      question: "What types of products will you be selling? Give me a few examples.",
      type: 'text',
      key: 'products'
    },
    {
      id: 'style_preference',
      question: "What style do you prefer for your website?",
      type: 'select',
      key: 'stylePreference',
      options: [
        'Modern & Minimalist',
        'Bold & Colorful',
        'Elegant & Sophisticated',
        'Fun & Playful',
        'Professional & Corporate',
        'Vintage & Retro'
      ]
    },
    {
      id: 'color_preference',
      question: "Do you have any color preferences for your brand?",
      type: 'text',
      key: 'colorPreference'
    },
    {
      id: 'features',
      question: "Which features are most important for your store?",
      type: 'multiselect',
      key: 'features',
      options: [
        'Product reviews & ratings',
        'Live chat support',
        'Email marketing integration',
        'Social media integration',
        'Blog/Content section',
        'Multi-language support',
        'Inventory management',
        'Advanced analytics'
      ]
    }
  ]

  useEffect(() => {
    // Start with welcome message
    setTimeout(() => {
      addBotMessage(onboardingSteps[0].question)
    }, 1000)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addBotMessage = (text) => {
    setIsTyping(true)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: text.replace('{name}', userResponses.name || ''),
        sender: 'bot',
        timestamp: new Date()
      }])
      setIsTyping(false)
    }, 1500)
  }

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }])
  }

  const handleSendMessage = () => {
    if (!currentInput.trim()) return

    const currentStepData = onboardingSteps[currentStep]
    addUserMessage(currentInput)
    
    // Save user response
    const newResponses = {
      ...userResponses,
      [currentStepData.key]: currentInput
    }
    setUserResponses(newResponses)
    
    setCurrentInput('')
    
    // Move to next step
    if (currentStep < onboardingSteps.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        addBotMessage(onboardingSteps[currentStep + 1].question)
      }, 1000)
    } else {
      // Onboarding complete
      setTimeout(() => {
        addBotMessage("Perfect! I have all the information I need. Let me create your amazing website now...")
        setTimeout(() => {
          handleCreateSite(newResponses)
        }, 2000)
      }, 1000)
    }
  }

  const handleOptionSelect = (option) => {
    const currentStepData = onboardingSteps[currentStep]
    
    if (currentStepData.type === 'multiselect') {
      // Handle multiple selections
      const currentSelections = userResponses[currentStepData.key] || []
      const newSelections = currentSelections.includes(option)
        ? currentSelections.filter(item => item !== option)
        : [...currentSelections, option]
      
      setUserResponses({
        ...userResponses,
        [currentStepData.key]: newSelections
      })
    } else {
      // Single selection
      addUserMessage(option)
      
      const newResponses = {
        ...userResponses,
        [currentStepData.key]: option
      }
      setUserResponses(newResponses)
      
      // Move to next step
      if (currentStep < onboardingSteps.length - 1) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1)
          addBotMessage(onboardingSteps[currentStep + 1].question)
        }, 1000)
      } else {
        setTimeout(() => {
          addBotMessage("Perfect! I have all the information I need. Let me create your amazing website now...")
          setTimeout(() => {
            handleCreateSite(newResponses)
          }, 2000)
        }, 1000)
      }
    }
  }

  const handleCreateSite = async (responses) => {
    try {
      // Simulate site creation
      addBotMessage("🎉 Your website is being created! This will take just a moment...")
      
      setTimeout(() => {
        addBotMessage("✨ Amazing! Your AI-powered e-commerce website is ready! Redirecting you to the site builder...")
        setTimeout(() => {
          window.location.href = '/builder'
        }, 2000)
      }, 3000)
    } catch (error) {
      addBotMessage("I encountered an issue creating your site. Let me try again...")
    }
  }

  const currentStepData = onboardingSteps[currentStep]
  const isMultiselect = currentStepData?.type === 'multiselect'
  const currentSelections = isMultiselect ? (userResponses[currentStepData.key] || []) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Site Builder</h1>
              <p className="text-sm text-gray-600">Let's create your perfect e-commerce website</p>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Step {currentStep + 1} of {onboardingSteps.length}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
        <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-gradient-to-r from-purple-600 to-pink-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    
                    {/* Message */}
                    <div className={`px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!isTyping && currentStep < onboardingSteps.length && (
            <div className="border-t border-gray-200 p-4">
              {currentStepData?.type === 'select' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {currentStepData.options.map((option, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleOptionSelect(option)}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              )}

              {currentStepData?.type === 'multiselect' && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {currentStepData.options.map((option, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleOptionSelect(option)}
                        className={`p-3 text-left border rounded-lg transition-colors ${
                          currentSelections.includes(option)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                  
                  {currentSelections.length > 0 && (
                    <Button
                      onClick={() => {
                        if (currentStep < onboardingSteps.length - 1) {
                          setCurrentStep(currentStep + 1)
                          addBotMessage(onboardingSteps[currentStep + 1].question)
                        } else {
                          addBotMessage("Perfect! I have all the information I need. Let me create your amazing website now...")
                          setTimeout(() => {
                            handleCreateSite(userResponses)
                          }, 2000)
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {currentStepData?.type === 'text' && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your answer..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingChat


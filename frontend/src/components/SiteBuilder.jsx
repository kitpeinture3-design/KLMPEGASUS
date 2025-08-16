import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Save, 
  Eye, 
  Smartphone, 
  Monitor, 
  Tablet,
  Undo,
  Redo,
  Settings,
  Palette,
  Type,
  Image,
  ShoppingCart,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const SiteBuilder = () => {
  const [selectedDevice, setSelectedDevice] = useState('desktop')
  const [selectedElement, setSelectedElement] = useState(null)
  const [siteData, setSiteData] = useState({
    name: 'My Amazing Store',
    pages: [
      {
        id: 'home',
        name: 'Home',
        blocks: [
          {
            id: 'hero-1',
            type: 'hero',
            content: {
              title: 'Welcome to My Amazing Store',
              subtitle: 'Discover our incredible products',
              buttonText: 'Shop Now',
              backgroundImage: '/api/placeholder/1200/600'
            }
          },
          {
            id: 'products-1',
            type: 'products',
            content: {
              title: 'Featured Products',
              products: [
                { id: 1, name: 'Product 1', price: '$99', image: '/api/placeholder/300/300' },
                { id: 2, name: 'Product 2', price: '$149', image: '/api/placeholder/300/300' },
                { id: 3, name: 'Product 3', price: '$199', image: '/api/placeholder/300/300' }
              ]
            }
          }
        ]
      }
    ],
    theme: {
      colors: {
        primary: '#3B82F6',
        secondary: '#64748B',
        accent: '#F59E0B'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    }
  })

  const devices = [
    { id: 'desktop', icon: Monitor, label: 'Desktop', width: '100%' },
    { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px' }
  ]

  const blockTypes = [
    { id: 'hero', name: 'Hero Section', icon: Image },
    { id: 'text', name: 'Text Block', icon: Type },
    { id: 'products', name: 'Product Grid', icon: ShoppingCart },
    { id: 'image', name: 'Image', icon: Image },
    { id: 'gallery', name: 'Gallery', icon: Image }
  ]

  const handleAddBlock = (type) => {
    const newBlock = {
      id: `${type}-${Date.now()}`,
      type,
      content: getDefaultContent(type)
    }

    setSiteData(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === 'home' 
          ? { ...page, blocks: [...page.blocks, newBlock] }
          : page
      )
    }))
  }

  const getDefaultContent = (type) => {
    switch (type) {
      case 'hero':
        return {
          title: 'New Hero Section',
          subtitle: 'Add your subtitle here',
          buttonText: 'Call to Action',
          backgroundImage: '/api/placeholder/1200/600'
        }
      case 'text':
        return {
          title: 'Text Block Title',
          content: 'Add your text content here...'
        }
      case 'products':
        return {
          title: 'Product Section',
          products: []
        }
      case 'image':
        return {
          src: '/api/placeholder/600/400',
          alt: 'Image description'
        }
      default:
        return {}
    }
  }

  const handleDeleteBlock = (blockId) => {
    setSiteData(prev => ({
      ...prev,
      pages: prev.pages.map(page => ({
        ...page,
        blocks: page.blocks.filter(block => block.id !== blockId)
      }))
    }))
  }

  const renderBlock = (block) => {
    switch (block.type) {
      case 'hero':
        return (
          <div 
            className="relative h-96 bg-cover bg-center flex items-center justify-center text-white"
            style={{ backgroundImage: `url(${block.content.backgroundImage})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="relative text-center z-10">
              <h1 className="text-4xl font-bold mb-4">{block.content.title}</h1>
              <p className="text-xl mb-6">{block.content.subtitle}</p>
              <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold">
                {block.content.buttonText}
              </button>
            </div>
          </div>
        )
      
      case 'text':
        return (
          <div className="py-12 px-6">
            <h2 className="text-3xl font-bold mb-6">{block.content.title}</h2>
            <p className="text-gray-600 leading-relaxed">{block.content.content}</p>
          </div>
        )
      
      case 'products':
        return (
          <div className="py-12 px-6">
            <h2 className="text-3xl font-bold text-center mb-12">{block.content.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {block.content.products.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-blue-600 font-bold">{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      
      default:
        return (
          <div className="py-8 px-6 bg-gray-100 text-center">
            <p className="text-gray-600">Block type: {block.type}</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Site Builder</h1>
          <p className="text-sm text-gray-600">{siteData.name}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button className="flex-1 py-3 px-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
            Blocks
          </button>
          <button className="flex-1 py-3 px-4 text-sm font-medium text-gray-600 hover:text-gray-900">
            Design
          </button>
          <button className="flex-1 py-3 px-4 text-sm font-medium text-gray-600 hover:text-gray-900">
            Settings
          </button>
        </div>

        {/* Block Library */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Add Blocks</h3>
          <div className="space-y-2">
            {blockTypes.map(blockType => (
              <button
                key={blockType.id}
                onClick={() => handleAddBlock(blockType.id)}
                className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <blockType.icon className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{blockType.name}</span>
              </button>
            ))}
          </div>

          {/* Current Page Blocks */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Page Blocks</h3>
            <div className="space-y-2">
              {siteData.pages[0].blocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedElement === block.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedElement(block.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {block.type} {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Edit3 className="h-3 w-3 text-gray-600" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteBlock(block.id)
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Undo className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Redo className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {/* Device selector */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {devices.map(device => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedDevice === device.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <device.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{device.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 overflow-auto bg-gray-100">
          <div className="flex justify-center">
            <motion.div
              key={selectedDevice}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white shadow-lg rounded-lg overflow-hidden"
              style={{ 
                width: devices.find(d => d.id === selectedDevice)?.width,
                maxWidth: '100%',
                minHeight: '600px'
              }}
            >
              {/* Site Preview */}
              <div className="relative">
                {siteData.pages[0].blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`relative group ${
                      selectedElement === block.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedElement(block.id)}
                  >
                    {renderBlock(block)}
                    
                    {/* Block overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button className="p-1 bg-white rounded shadow-sm hover:bg-gray-50">
                          <Edit3 className="h-3 w-3 text-gray-600" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBlock(block.id)
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add block button */}
                <div className="p-8 text-center border-t border-gray-200">
                  <button className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Plus className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-600 font-medium">Add Block</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedElement && (
        <div className="w-80 bg-white shadow-lg border-l border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
            <p className="text-sm text-gray-600">
              {siteData.pages[0].blocks.find(b => b.id === selectedElement)?.type} Block
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Block Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  className="w-12 h-10 border border-gray-300 rounded-lg"
                  defaultValue="#ffffff"
                />
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spacing
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Top"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Bottom"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SiteBuilder


import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Globe, 
  BarChart3, 
  Settings, 
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSites([
        {
          id: '1',
          name: 'Fashion Boutique',
          slug: 'fashion-boutique',
          domain: 'fashionboutique.com',
          status: 'PUBLISHED',
          publishedAt: '2024-01-15',
          createdAt: '2024-01-10',
          stats: {
            pages: 8,
            products: 45,
            orders: 23,
            visitors: 1250
          }
        },
        {
          id: '2',
          name: 'Tech Gadgets Store',
          slug: 'tech-gadgets',
          domain: null,
          status: 'DRAFT',
          publishedAt: null,
          createdAt: '2024-01-20',
          stats: {
            pages: 5,
            products: 12,
            orders: 0,
            visitors: 0
          }
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.slug.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || site.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesFilter
  })

  const handleCreateSite = () => {
    window.location.href = '/onboarding'
  }

  const handleEditSite = (siteId) => {
    window.location.href = `/builder/${siteId}`
  }

  const handleViewSite = (site) => {
    if (site.domain) {
      window.open(`https://${site.domain}`, '_blank')
    } else {
      window.open(`https://${site.slug}.klmpegasus.com`, '_blank')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <span className="text-gray-500">Welcome back, {user?.firstName}!</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sites</p>
                <p className="text-2xl font-bold text-gray-900">{sites.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sites.reduce((sum, site) => sum + site.stats.visitors, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sites.reduce((sum, site) => sum + site.stats.orders, 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sites.reduce((sum, site) => sum + site.stats.products, 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sites Section */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Your Sites</h2>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sites..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>

                {/* Create Site Button */}
                <Button onClick={handleCreateSite} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Site
                </Button>
              </div>
            </div>
          </div>

          {/* Sites List */}
          <div className="p-6">
            {filteredSites.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {sites.length === 0 ? 'No sites yet' : 'No sites found'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {sites.length === 0 
                    ? 'Create your first AI-powered e-commerce site in minutes'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {sites.length === 0 && (
                  <Button onClick={handleCreateSite} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Site
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSites.map((site, index) => (
                  <motion.div
                    key={site.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Site Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {site.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {site.domain || `${site.slug}.klmpegasus.com`}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(site.status)}`}>
                          {site.status}
                        </span>
                        
                        <div className="relative group">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                          
                          {/* Dropdown menu */}
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => handleEditSite(site.id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Site
                            </button>
                            <button
                              onClick={() => handleViewSite(site)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Site
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Site Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{site.stats.products}</p>
                        <p className="text-xs text-gray-600">Products</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{site.stats.orders}</p>
                        <p className="text-xs text-gray-600">Orders</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSite(site.id)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSite(site)}
                        className="flex-1"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard


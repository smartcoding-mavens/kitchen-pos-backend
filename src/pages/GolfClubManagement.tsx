import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { 
  fetchGolfClubs, 
  createGolfClub, 
  updateGolfClub, 
  updateGolfClubStatus,
  deleteGolfClub,
  setSelectedGolfClub,
  clearError
} from '../store/slices/golfClubSlice'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MapPin,
  Mail,
  Phone,
  Building,
  Eye,
  EyeOff
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { GolfClubService, CreateGolfClubData } from '../services/golfClubService'

interface GolfClub {
  id: string
  kitchen_owner_id: string
  name: string
  description?: string
  address: string
  email: string
  phone_number: string
  city: string
  state: string
  country: string
  zipcode: number
  status: 'active' | 'inactive'
  location?: string
  created_at: string
  updated_at: string
}

export default function GolfClubManagement() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const { golfClubs, loading, error } = useAppSelector((state) => state.golfClub)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showGolfClubModal, setShowGolfClubModal] = useState(false)
  const [editingGolfClub, setEditingGolfClub] = useState<GolfClub | null>(null)
  const [kitchenOwnerId, setKitchenOwnerId] = useState<string | null>(null)

  const [golfClubForm, setGolfClubForm] = useState({
    name: '',
    description: '',
    address: '',
    email: '',
    phone_number: '',
    city: '',
    state: '',
    country: 'United States',
    zipcode: '',
    status: 'active' as 'active' | 'inactive',
    location: ''
  })

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (user?.email) {
      fetchKitchenOwnerData()
    }
  }, [user])

  useEffect(() => {
    if (kitchenOwnerId) {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined
      dispatch(fetchGolfClubs({ kitchenOwnerId, filters }))
    }
  }, [kitchenOwnerId, statusFilter, dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const fetchKitchenOwnerData = async () => {
    try {
      const { data: kitchenOwner, error } = await supabase
        .from('kitchen_owners')
        .select('id')
        .eq('email', user?.email)
        .single()

      if (error) throw error
      setKitchenOwnerId(kitchenOwner.id)
    } catch (error) {
      console.error('Error fetching kitchen owner:', error)
      toast.error('Failed to load kitchen owner data')
    }
  }

  const validateForm = async () => {
    const errors = await GolfClubService.validateGolfClubData(golfClubForm)
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!await validateForm() || !kitchenOwnerId) return
    
    try {
      const golfClubData: CreateGolfClubData = {
        ...golfClubForm,
        kitchen_owner_id: kitchenOwnerId,
        zipcode: Number(golfClubForm.zipcode)
      }

      if (editingGolfClub) {
        await dispatch(updateGolfClub({ id: editingGolfClub.id, updates: golfClubData })).unwrap()
        toast.success('Golf club updated successfully')
      } else {
        await dispatch(createGolfClub(golfClubData)).unwrap()
        toast.success('Golf club created successfully')
      }

      setShowGolfClubModal(false)
      setEditingGolfClub(null)
      resetForm()

    } catch (error: any) {
      console.error('Error saving golf club:', error)
    }
  }

  const handleDelete = async (golfClubId: string) => {
    if (!confirm('Are you sure you want to delete this golf club? This action cannot be undone.')) {
      return
    }

    try {
      await dispatch(deleteGolfClub(golfClubId)).unwrap()
      toast.success('Golf club deleted successfully')
    } catch (error: any) {
      console.error('Error deleting golf club:', error)
    }
  }

  const toggleGolfClubStatus = async (golfClubId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      await dispatch(updateGolfClubStatus({ id: golfClubId, status: newStatus })).unwrap()
      toast.success(`Golf club ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
    } catch (error: any) {
      console.error('Error updating golf club status:', error)
    }
  }

  const openGolfClubModal = (golfClub?: GolfClub) => {
    if (golfClub) {
      setEditingGolfClub(golfClub)
      setGolfClubForm({
        name: golfClub.name,
        description: golfClub.description || '',
        address: golfClub.address,
        email: golfClub.email,
        phone_number: golfClub.phone_number,
        city: golfClub.city,
        state: golfClub.state,
        country: golfClub.country,
        zipcode: golfClub.zipcode.toString(),
        status: golfClub.status,
        location: golfClub.location || ''
      })
    } else {
      setEditingGolfClub(null)
      resetForm()
    }
    setFormErrors({})
    setShowGolfClubModal(true)
  }

  const resetForm = () => {
    setGolfClubForm({
      name: '',
      description: '',
      address: '',
      email: '',
      phone_number: '',
      city: '',
      state: '',
      country: 'United States',
      zipcode: '',
      status: 'active',
      location: ''
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setGolfClubForm(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const filteredGolfClubs = golfClubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.state.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || club.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Golf Club Management</h1>
            <p className="text-gray-600">Manage your golf club partnerships</p>
          </div>
          <button
            onClick={() => openGolfClubModal()}
            className="btn-primary btn-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Golf Club
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card hover-lift">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Golf Clubs</p>
                  <p className="text-2xl font-bold text-gray-900">{golfClubs.length}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <Building className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Clubs</p>
                  <p className="text-2xl font-bold text-success-600">
                    {golfClubs.filter(club => club.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 bg-success-100 rounded-full">
                  <Eye className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive Clubs</p>
                  <p className="text-2xl font-bold text-error-600">
                    {golfClubs.filter(club => club.status === 'inactive').length}
                  </p>
                </div>
                <div className="p-3 bg-error-100 rounded-full">
                  <EyeOff className="h-6 w-6 text-error-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="card-content">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search golf clubs..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="input w-48"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Golf Clubs Table */}
        <div className="card">
          <div className="card-content">
            {filteredGolfClubs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Golf Club</th>
                      <th>Location</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGolfClubs.map((club) => (
                      <tr key={club.id}>
                        <td>
                          <div>
                            <p className="font-medium text-gray-900">{club.name}</p>
                            {club.description && (
                              <p className="text-sm text-gray-600 truncate max-w-xs">
                                {club.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-900">{club.city}, {club.state}</p>
                              <p className="text-xs text-gray-600">{club.zipcode}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-900">{club.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-900">{club.phone_number}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleGolfClubStatus(club.id, club.status)}
                            className={`badge cursor-pointer ${
                              club.status === 'active' ? 'badge-success' : 'badge-error'
                            }`}
                          >
                            {club.status === 'active' ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openGolfClubModal(club)}
                              className="btn-sm btn-secondary"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(club.id)}
                              className="btn-sm btn-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' ? 'No golf clubs match your filters' : 'No golf clubs yet'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => openGolfClubModal()}
                    className="btn-primary btn-sm mt-2"
                  >
                    Add First Golf Club
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Golf Club Modal */}
        {showGolfClubModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingGolfClub ? 'Edit Golf Club' : 'Add Golf Club'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Golf Club Name *
                      </label>
                      <input
                        type="text"
                        required
                        className={`input ${formErrors.name ? 'border-red-500' : ''}`}
                        value={golfClubForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter golf club name"
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        className="input"
                        value={golfClubForm.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="input resize-none"
                      rows={3}
                      value={golfClubForm.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of the golf club"
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          className={`input ${formErrors.email ? 'border-red-500' : ''}`}
                          value={golfClubForm.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="contact@golfclub.com"
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          className={`input ${formErrors.phone_number ? 'border-red-500' : ''}`}
                          value={golfClubForm.phone_number}
                          onChange={(e) => handleInputChange('phone_number', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                        {formErrors.phone_number && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.phone_number}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Address Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        className={`input ${formErrors.address ? 'border-red-500' : ''}`}
                        value={golfClubForm.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="123 Golf Course Drive"
                      />
                      {formErrors.address && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          className={`input ${formErrors.city ? 'border-red-500' : ''}`}
                          value={golfClubForm.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="City name"
                        />
                        {formErrors.city && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          className={`input ${formErrors.state ? 'border-red-500' : ''}`}
                          value={golfClubForm.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="State"
                        />
                        {formErrors.state && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.state}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Zipcode *
                        </label>
                        <input
                          type="number"
                          required
                          className={`input ${formErrors.zipcode ? 'border-red-500' : ''}`}
                          value={golfClubForm.zipcode}
                          onChange={(e) => handleInputChange('zipcode', e.target.value)}
                          placeholder="12345"
                        />
                        {formErrors.zipcode && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.zipcode}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={golfClubForm.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          placeholder="United States"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location Notes
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={golfClubForm.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="e.g., Near downtown, Highway exit 15"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowGolfClubModal(false)}
                      className="btn-secondary btn-md flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary btn-md flex-1"
                    >
                      {editingGolfClub ? 'Update Golf Club' : 'Create Golf Club'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
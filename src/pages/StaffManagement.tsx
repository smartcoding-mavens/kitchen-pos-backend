import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { 
  fetchStaff, 
  createStaff as createStaffAction, 
  updateStaff as updateStaffAction, 
  deleteStaff as deleteStaffAction,
  updateStaffStatus as updateStaffStatusAction,
  clearError
} from '../store/slices/staffSlice'
import { fetchRevenueCenters } from '../store/slices/restaurantSlice'
import Layout from '../components/Layout'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  UserPlus,
  Shield,
  Users as UsersIcon
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface Staff {
  id: string
  email: string
  full_name: string
  role: 'manager' | 'staff'
  is_active: boolean
  created_at: string
  staff_assignments: Array<{
    revenue_centers: {
      id: string
      name: string
      type: string
    }
  }>
}

export default function StaffManagement() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const { staff, loading, error } = useAppSelector((state) => state.staff)
  const { revenueCenters } = useAppSelector((state) => state.restaurant)
  const [searchTerm, setSearchTerm] = useState('')
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const [staffForm, setStaffForm] = useState({
    email: '',
    full_name: '',
    role: 'staff' as 'manager' | 'staff',
    password: '',
    revenue_center_ids: [] as string[]
  })

  useEffect(() => {
    if (user?.restaurant_id) {
      dispatch(fetchStaff(user.restaurant_id))
      dispatch(fetchRevenueCenters(user.restaurant_id))
    }
  }, [user, dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const generateRandomPassword = (length: number = 8): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingStaff) {
        await dispatch(updateStaffAction({ 
          staffId: editingStaff.id, 
          updates: {
            full_name: staffForm.full_name,
            role: staffForm.role,
            is_active: true
          }
        })).unwrap()
        toast.success('Staff member updated successfully')
      } else {
        const staffData = {
          email: staffForm.email,
          full_name: staffForm.full_name,
          role: staffForm.role,
          restaurant_id: user?.restaurant_id!,
          password: staffForm.password,
          revenue_center_ids: staffForm.revenue_center_ids
        }

        const result = await dispatch(createStaffAction(staffData)).unwrap()
        toast.success(`Staff member created successfully. Password: ${result.password}`)
      }

      setShowStaffModal(false)
      setEditingStaff(null)
      setStaffForm({
        email: '',
        full_name: '',
        role: 'staff',
        password: '',
        revenue_center_ids: []
      })

    } catch (error: any) {
      console.error('Error saving staff:', error)
    }
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return
    }

    try {
      await dispatch(deleteStaffAction(staffId)).unwrap()
      toast.success('Staff member deleted successfully')
    } catch (error: any) {
      console.error('Error deleting staff:', error)
    }
  }

  const toggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      await dispatch(updateStaffStatusAction({ staffId, isActive: !currentStatus })).unwrap()
      toast.success(`Staff member ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error: any) {
      console.error('Error updating staff status:', error)
    }
  }

  const openStaffModal = (staffMember?: Staff) => {
    if (staffMember) {
      setEditingStaff(staffMember)
      setStaffForm({
        email: staffMember.email,
        full_name: staffMember.full_name,
        role: staffMember.role,
        password: '',
        revenue_center_ids: staffMember.staff_assignments.map(
          assignment => assignment.revenue_centers.id
        )
      })
    } else {
      setEditingStaff(null)
      setStaffForm({
        email: '',
        full_name: '',
        role: 'staff',
        password: '',
        revenue_center_ids: []
      })
    }
    setShowStaffModal(true)
  }

  const filteredStaff = staff.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600">Manage your restaurant staff and their permissions</p>
          </div>
          <button
            onClick={() => openStaffModal()}
            className="btn-primary btn-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </button>
        </div>

        {/* Search */}
        <div className="card">
          <div className="card-content">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff members..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="card">
          <div className="card-content">
            {filteredStaff.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Role</th>
                      <th>Assigned Centers</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <div>
                            <p className="font-medium text-gray-900">{member.full_name}</p>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {member.role === 'manager' ? (
                              <Shield className="h-4 w-4 text-primary-600" />
                            ) : (
                              <UsersIcon className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={`badge ${
                              member.role === 'manager' ? 'badge-info' : 'badge-gray'
                            } capitalize`}>
                              {member.role}
                            </span>
                          </div>
                        </td>
                        <td>
                          {member.staff_assignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {member.staff_assignments.map((assignment, index) => (
                                <span
                                  key={index}
                                  className="badge badge-success text-xs"
                                >
                                  {assignment.revenue_centers.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">No assignments</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => toggleStaffStatus(member.id, member.is_active)}
                            className={`badge cursor-pointer ${
                              member.is_active ? 'badge-success' : 'badge-error'
                            }`}
                          >
                            {member.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openStaffModal(member)}
                              className="btn-sm btn-secondary"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
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
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'No staff members match your search' : 'No staff members yet'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => openStaffModal()}
                    className="btn-primary btn-sm mt-2"
                  >
                    Add First Staff Member
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Staff Modal */}
        {showStaffModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={staffForm.full_name}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!!editingStaff}
                      className="input disabled:bg-gray-100"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      required
                      className="input"
                      value={staffForm.role}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value as 'manager' | 'staff' }))}
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>

                  {!editingStaff && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Leave empty to generate random password"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If left empty, a random password will be generated
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign to Revenue Centers
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                      {revenueCenters.map((center) => (
                        <label key={center.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={staffForm.revenue_center_ids.includes(center.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStaffForm(prev => ({
                                  ...prev,
                                  revenue_center_ids: [...prev.revenue_center_ids, center.id]
                                }))
                              } else {
                                setStaffForm(prev => ({
                                  ...prev,
                                  revenue_center_ids: prev.revenue_center_ids.filter(id => id !== center.id)
                                }))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">
                            {center.name} ({center.type})
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Staff can only view orders from assigned revenue centers
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowStaffModal(false)}
                      className="btn-secondary btn-md flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary btn-md flex-1"
                    >
                      {editingStaff ? 'Update' : 'Create'}
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
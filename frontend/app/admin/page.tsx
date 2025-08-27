'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { AdminService } from '@/lib/api/admin'
import { formatCurrency } from '@/lib/utils'
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign,
  Building,
  Download,
  Settings,
  LogOut,
  FileText,
  Shield,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react'

interface DashboardStats {
  organizations: {
    total: number
    active: number
    pending: number
    inactive: number
  }
  donations: {
    total: number
    paid: number
    totalAmount: number
    last30Days: number
  }
  users: {
    total: number
    active: number
    admins: number
    orgOwners: number
  }
  goals: {
    total: number
    active: number
  }
}

interface Organization {
  id: string
  name: string
  slug: string
  nip: string
  email: string
  status: number  // 0: pending, 1: active, 2: inactive
  createdAt: string
  totalDonations?: number
  totalRaised?: number
  totalAmount?: number
}

interface User {
  id: string
  email: string
  role: number  // 0: Admin, 1: OrgOwner, 2: User
  isActive: boolean
  createdAt: string
  organizationId?: string
  organizationName?: string
  organization?: {
    name: string
  }
}

type TabType = 'overview' | 'organizations' | 'users' | 'reports'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAddOrganization, setShowAddOrganization] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)

  // Helper function to convert status number to string
  const getStatusString = (status: number): string => {
    switch (status) {
      case 0: return 'Oczekująca'
      case 1: return 'Aktywna'
      case 2: return 'Nieaktywna'
      default: return 'Nieznany'
    }
  }

  // Helper function to convert role number to string
  const getRoleString = (role: number): string => {
    switch (role) {
      case 0: return 'Administrator'
      case 1: return 'Właściciel'
      case 2: return 'Użytkownik'
      default: return 'Nieznany'
    }
  }

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('userRole')
    
    console.log('checkAuth - token:', token ? 'exists' : 'missing')
    console.log('checkAuth - role:', role)
    
    if (!token || !role) {
      console.log('checkAuth - redirecting to login')
      router.push('/admin/login')
      return
    }

    // Redirect OrgOwner users to their organization panel
    if (role === 'OrgOwner') {
      console.log('checkAuth - OrgOwner user, redirecting to organization panel')
      router.push('/panel')
      return
    }

    // Only allow Admin users on this page
    if (role !== 'Admin') {
      console.log('checkAuth - non-admin user, redirecting to login')
      router.push('/admin/login')
      return
    }

    // Set user role from localStorage
    console.log('checkAuth - setting userRole to:', role)
    setUserRole(role)
  }, [router])

  const loadDashboardData = useCallback(async () => {
    try {
      console.log('loadDashboardData - starting, userRole:', userRole)
      setLoading(true)
      setError(null)
      
      // Load statistics
      console.log('loadDashboardData - calling getStatistics')
      const statsData = await AdminService.getStatistics()
      console.log('loadDashboardData - statsData received:', statsData)
      setStats(statsData)

      // Load organizations for admin
      if (userRole === 'Admin') {
        console.log('loadDashboardData - userRole is Admin, loading orgs and users')
        const orgsData = await AdminService.getOrganizations()
        setOrganizations(orgsData.organizations || [])
        
        const usersData = await AdminService.getUsers()
        setUsers(usersData.users || [])
      } else {
        console.log('loadDashboardData - userRole is not Admin:', userRole)
      }
    } catch (err) {
      const error = err as Error
      console.error('Failed to load dashboard data:', error)
      setError(error.message || 'Failed to load data')
      
      // If unauthorized, redirect to login
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }, [userRole, router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (userRole) {
      loadDashboardData()
    }
  }, [userRole, loadDashboardData])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    router.push('/admin/login')
  }

  const handleExportDonations = async () => {
    try {
      await AdminService.exportDonationsCSV()
    } catch (err) {
      console.error('Failed to export donations:', err)
      setError('Failed to export donations')
    }
  }

  const handleExportOrganizations = async () => {
    try {
      await AdminService.exportOrganizationsCSV()
    } catch (err) {
      console.error('Failed to export organizations:', err)
      setError('Failed to export organizations')
    }
  }

  const handleToggleUserActive = async (userId: string) => {
    try {
      await AdminService.toggleUserActive(userId)
      await loadDashboardData() // Reload data
    } catch (err) {
      console.error('Failed to toggle user status:', err)
      setError('Failed to update user status')
    }
  }

  const handleAddOrganization = async (formData: FormData) => {
    try {
      // Call register organization endpoint using AdminService
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1.0'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(Object.fromEntries(formData))
      })
      
      if (response.ok) {
        setShowAddOrganization(false)
        loadDashboardData() // Reload data
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to add organization:', error)
      alert('Failed to add organization')
    }
  }

  const handleAddUser = async (formData: FormData) => {
    try {
      // For now, users can only be created via organization registration
      // System admin can create other admins using seed-admin endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1.0'}/admin/seed-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...Object.fromEntries(formData),
          seedKey: 'admin-secret-key' // This should be from environment
        })
      })
      
      if (response.ok) {
        setShowAddUser(false)
        loadDashboardData() // Reload data
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to add user:', error)
      alert('Failed to add user')
    }
  }

  // QR code generation moved to organization-specific admin panel

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Ładowanie...</div>
      </div>
    )
  }

  const statCards = stats ? [
    {
      title: userRole === 'Admin' ? 'Organizacje' : 'Status Organizacji',
      value: userRole === 'Admin' ? stats.organizations.total.toString() : 
             stats.organizations.active > 0 ? 'Aktywna' : 'Nieaktywna',
      icon: Building,
      color: 'from-blue-500 to-cyan-500',
      subtitle: userRole === 'Admin' ? `${stats.organizations.active} aktywnych` : null,
    },
    {
      title: 'Całkowite wpłaty',
      value: formatCurrency(stats.donations.totalAmount),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      subtitle: `${stats.donations.paid} opłaconych`,
    },
    {
      title: userRole === 'Admin' ? 'Użytkownicy' : 'Aktywne cele',
      value: userRole === 'Admin' ? stats.users.total.toString() : stats.goals.active.toString(),
      icon: userRole === 'Admin' ? Users : Target,
      color: 'from-purple-500 to-pink-500',
      subtitle: userRole === 'Admin' ? `${stats.users.active} aktywnych` : `z ${stats.goals.total} całkowitych`,
    },
    {
      title: 'Ostatnie 30 dni',
      value: stats.donations.last30Days.toString(),
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      subtitle: 'wpłat',
    },
  ] : []

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {userRole === 'Admin' ? 'Panel Administratora Systemu' : 'Panel Zarządzania Organizacją'}
            </h1>
            <p className="text-white/60">
              {userRole === 'Admin' ? 'Zarządzaj wszystkimi organizacjami w systemie' : 'Zarządzaj swoją organizacją i monitoruj postępy'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* User info */}
            <div className="text-right">
              <p className="text-white text-sm">{localStorage.getItem('userEmail')}</p>
              <p className="text-white/60 text-xs flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {userRole}
              </p>
            </div>

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-3 glass rounded-xl hover:bg-white/20 transition-colors"
            >
              <LogOut className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
      </header>

      {/* Tab Navigation for Admin */}
      {userRole === 'Admin' && (
        <div className="flex gap-4 mb-8">
          {['overview', 'organizations', 'users', 'reports'].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab as TabType)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white' 
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              {tab === 'overview' && 'Przegląd'}
              {tab === 'organizations' && 'Organizacje'}
              {tab === 'users' && 'Użytkownicy'}
              {tab === 'reports' && 'Raporty'}
            </motion.button>
          ))}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover={false} className="relative overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-white/70 text-sm mb-1">{stat.title}</h3>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-white/50 text-sm mt-1">{stat.subtitle}</p>
                  )}

                  {/* Background decoration */}
                  <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-r ${stat.color} opacity-10`} />
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Eksport danych</h3>
                    <p className="text-white/60 text-sm">CSV i raporty</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportDonations}
                  className="flex-1 px-3 py-2 glass rounded-lg text-white/70 hover:text-white text-sm"
                >
                  Wpłaty
                </motion.button>
                {userRole === 'Admin' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExportOrganizations}
                    className="flex-1 px-3 py-2 glass rounded-lg text-white/70 hover:text-white text-sm"
                  >
                    Organizacje
                  </motion.button>
                )}
              </div>
            </GlassCard>


            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Raporty miesięczne</h3>
                    <p className="text-white/60 text-sm">Email z podsumowaniem</p>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-3 py-2 glass rounded-lg text-white/70 hover:text-white text-sm"
              >
                Wyślij raport
              </motion.button>
            </GlassCard>
          </div>
        </>
      )}

      {/* Organizations Tab (Admin only) */}
      {activeTab === 'organizations' && userRole === 'Admin' && (
        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Organizacje</h2>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddOrganization(true)}
                className="px-4 py-2 bg-gradient-to-r from-accent-blue to-accent-purple rounded-lg hover:shadow-lg transition-all flex items-center gap-2 text-white"
              >
                <Plus className="w-4 h-4" />
                Dodaj organizację
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportOrganizations}
                className="px-4 py-2 glass rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-white"
              >
                <Download className="w-4 h-4" />
                Eksportuj CSV
              </motion.button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Nazwa</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">NIP</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Wpłaty</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white">{org.name}</td>
                    <td className="py-4 px-4 text-white/70">{org.nip}</td>
                    <td className="py-4 px-4 text-white/70">{org.email}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-lg text-sm ${
                        org.status === 1 
                          ? 'bg-green-500/20 text-green-400'
                          : org.status === 0
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {org.status === 1 && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {org.status === 0 && <AlertCircle className="w-3 h-3 inline mr-1" />}
                        {org.status === 2 && <XCircle className="w-3 h-3 inline mr-1" />}
                        {getStatusString(org.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {formatCurrency(org.totalAmount || 0)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
                          title="Ustawienia"
                        >
                          <Settings className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Users Tab (Admin only) */}
      {activeTab === 'users' && userRole === 'Admin' && (
        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Użytkownicy</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddUser(true)}
              className="px-4 py-2 bg-gradient-to-r from-accent-blue to-accent-purple rounded-lg hover:shadow-lg transition-all flex items-center gap-2 text-white"
            >
              <Plus className="w-4 h-4" />
              Dodaj użytkownika
            </motion.button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Rola</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Organizacja</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Data utworzenia</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white">{user.email}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-lg text-sm ${
                        user.role === 0
                          ? 'bg-purple-500/20 text-purple-400'
                          : user.role === 1
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role === 0 && <Shield className="w-3 h-3 inline mr-1" />}
                        {user.role === 1 && <UserCheck className="w-3 h-3 inline mr-1" />}
                        {getRoleString(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white/70">
                      {user.organization?.name || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-lg text-sm ${
                        user.isActive 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white/70">
                      {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="py-4 px-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleUserActive(user.id)}
                        className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
                        title={user.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                      >
                        {user.isActive ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard hover={false}>
            <h3 className="text-xl font-bold text-white mb-4">Eksport danych</h3>
            <p className="text-white/60 mb-6">Pobierz dane w formacie CSV do analizy</p>
            
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportDonations}
                className="w-full p-3 glass rounded-lg text-white hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <span>Eksportuj wpłaty</span>
                <Download className="w-5 h-5" />
              </motion.button>
              
              {userRole === 'Admin' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportOrganizations}
                  className="w-full p-3 glass rounded-lg text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>Eksportuj organizacje</span>
                  <Download className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </GlassCard>

        </div>
      )}

      {/* Add Organization Modal */}
      {showAddOrganization && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-basilica-dark to-basilica-darker rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Dodaj Organizację</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleAddOrganization(formData)
            }}>
              <div className="space-y-4">
                <input
                  name="organizationName"
                  type="text"
                  placeholder="Nazwa organizacji"
                  required
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
                <input
                  name="nip"
                  type="text"
                  placeholder="NIP"
                  required
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
                <input
                  name="krs"
                  type="text"
                  placeholder="KRS (opcjonalne)"
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
                <input
                  name="bankAccount"
                  type="text"
                  placeholder="Numer konta bankowego"
                  required
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email administratora"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Hasło administratora"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-white font-semibold"
                >
                  Dodaj
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddOrganization(false)}
                  className="flex-1 py-3 glass rounded-xl text-white font-semibold"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-basilica-dark to-basilica-darker rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Dodaj Użytkownika</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleAddUser(formData)
            }}>
              <div className="space-y-4">
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Hasło"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
                <label className="text-white/70 text-sm mb-1 block">Rola użytkownika *</label>
                <select
                  name="role"
                  required
                  aria-label="Rola użytkownika"
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white"
                >
                  <option value="0">Admin Systemu</option>
                  <option value="1">Administrator Organizacji</option>
                  <option value="2">Pracownik</option>
                </select>
                <label className="text-white/70 text-sm mb-1 block">Organizacja</label>
                <select
                  name="organizationId"
                  aria-label="Organizacja"
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white"
                >
                  <option value="">Bez organizacji</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-white font-semibold"
                >
                  Dodaj
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 py-3 glass rounded-xl text-white font-semibold"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
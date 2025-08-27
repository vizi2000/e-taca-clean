'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { formatCurrency } from '@/lib/utils'
import { apiEndpoint } from '@/lib/api/config'
import { 
  Target, 
  TrendingUp, 
  DollarSign,
  Download,
  BarChart3,
  QrCode,
  Shield,
  LogOut,
  FileText,
  Plus,
  Edit,
  Eye,
  Trash2,
  Church
} from 'lucide-react'
import Link from 'next/link'

interface OrganizationStats {
  totalDonations: number
  totalAmount: number
  activeGoals: number
  last30Days: number
  monthlyAverage: number
  topGoal: string
}

interface Goal {
  id: string
  title: string
  description: string
  targetAmount: number
  currentAmount: number
  slug: string
  isActive: boolean
  createdAt: string
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  nip: string;
  status: number;
}

export default function OrganizationPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<OrganizationStats | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'donations' | 'qr' | 'settings'>('overview')
  const [error, setError] = useState<string | null>(null)

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const role = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      
      // Check if user is OrgOwner
      if (role !== 'OrgOwner' && role !== 'Admin') {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Failed to decode token:', error)
      router.push('/admin/login')
    }
  }, [router])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      
      // Load organization data
      const orgResponse = await fetch(apiEndpoint('/organizations/my'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganization(orgData)
        
        // Check if organization is pending activation
        if (orgData.status === 0) {
          // Organization is pending - show limited functionality
          setStats({
            totalDonations: 0,
            totalAmount: 0,
            activeGoals: 0,
            last30Days: 0,
            monthlyAverage: 0,
            topGoal: 'Oczekuje na aktywację'
          })
          return
        }
        
        // Load goals only for active organizations
        const goalsResponse = await fetch(apiEndpoint(`/organizations/${orgData.id}/goals`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        let goalsData: Goal[] = []
        if (goalsResponse.ok) {
          goalsData = await goalsResponse.json()
          setGoals(goalsData)
        }

        // Calculate stats
        const statsData: OrganizationStats = {
          totalDonations: orgData.totalDonations || 0,
          totalAmount: orgData.totalAmount || 0,
          activeGoals: goalsData?.filter((g: Goal) => g.isActive).length || 0,
          last30Days: orgData.last30DaysDonations || 0,
          monthlyAverage: orgData.monthlyAverage || 0,
          topGoal: goalsData?.[0]?.title || 'Brak celów'
        }
        setStats(statsData)
      }
    } catch (error) {
      const err = error as Error
      console.error('Failed to load dashboard data:', err)
      setError(err.message || 'Nie udało się załadować danych')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
    loadDashboardData()
  }, [checkAuth, loadDashboardData])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    router.push('/admin/login')
  }

  const handleExportDonations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiEndpoint(`/organizations/${organization?.id}/donations/export`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
      }
    } catch (err) {
      console.error('Failed to export donations:', err)
      setError('Nie udało się wyeksportować danych')
    }
  }

  const handleGenerateQRCodes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiEndpoint(`/admin/pdf/qrcodes/${organization?.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qr_codes_${organization?.slug}.pdf`
        a.click()
      }
    } catch (err) {
      console.error('Failed to generate QR codes:', err)
      setError('Nie udało się wygenerować kodów QR')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Ładowanie...</div>
      </div>
    )
  }

  const statCards = stats ? [
    {
      title: 'Całkowite wpłaty',
      value: formatCurrency(stats.totalAmount),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      subtitle: `${stats.totalDonations} wpłat`,
    },
    {
      title: 'Aktywne cele',
      value: stats.activeGoals.toString(),
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      subtitle: `z ${goals.length} całkowitych`,
    },
    {
      title: 'Ostatnie 30 dni',
      value: stats.last30Days.toString(),
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      subtitle: 'wpłat',
    },
    {
      title: 'Średnia miesięczna',
      value: formatCurrency(stats.monthlyAverage),
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      subtitle: 'przychód',
    },
  ] : []

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Church className="w-8 h-8" />
              Panel Organizacji
            </h1>
            <p className="text-white/60">
              {organization?.name || 'Ładowanie...'}
            </p>
            {organization?.status === 0 && (
              <div className="mt-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg inline-block">
                <p className="text-yellow-400 text-sm font-medium">
                  ⏳ Organizacja oczekuje na aktywację przez administratora
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Organization info */}
            <div className="text-right">
              <p className="text-white text-sm">{localStorage.getItem('userEmail')}</p>
              <p className="text-white/60 text-xs flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Administrator Organizacji
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
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8">
        {['overview', 'goals', 'donations', 'qr', 'settings'].map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab as 'overview' | 'goals' | 'donations' | 'qr' | 'settings')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === tab 
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white' 
                : 'glass text-white/70 hover:text-white'
            }`}
          >
            {tab === 'overview' && 'Przegląd'}
            {tab === 'goals' && 'Cele'}
            {tab === 'donations' && 'Wpłaty'}
            {tab === 'qr' && 'Kody QR'}
            {tab === 'settings' && 'Ustawienia'}
          </motion.button>
        ))}
      </div>

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
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Zarządzaj celami</h3>
                    <p className="text-white/60 text-sm">Dodaj lub edytuj cele</p>
                  </div>
                </div>
              </div>
              <Link href="/panel/goals">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-3 py-2 bg-gradient-to-r from-accent-blue to-accent-purple rounded-lg text-white text-sm"
                >
                  Przejdź do celów
                </motion.button>
              </Link>
            </GlassCard>

            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Kody QR</h3>
                    <p className="text-white/60 text-sm">Generuj PDF z kodami</p>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateQRCodes}
                className="w-full px-3 py-2 bg-gradient-to-r from-accent-blue to-accent-purple rounded-lg text-white text-sm"
              >
                Pobierz kody QR
              </motion.button>
            </GlassCard>

            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Eksport danych</h3>
                    <p className="text-white/60 text-sm">Pobierz CSV wpłat</p>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportDonations}
                className="w-full px-3 py-2 glass rounded-lg text-white text-sm hover:bg-white/20"
              >
                Eksportuj wpłaty
              </motion.button>
            </GlassCard>
          </div>
        </>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Cele zbiórek</h2>
            <Link href="/panel/goals/new">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-accent-blue to-accent-purple rounded-lg hover:shadow-lg transition-all flex items-center gap-2 text-white"
              >
                <Plus className="w-4 h-4" />
                Dodaj cel
              </motion.button>
            </Link>
          </div>

          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{goal.title}</h3>
                  <p className="text-white/60 text-sm mt-1">{goal.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-white/50 text-sm">
                      Cel: {formatCurrency(goal.targetAmount)}
                    </span>
                    <span className="text-green-400 text-sm">
                      Zebrano: {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      goal.isActive 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {goal.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
                    title="Podgląd"
                  >
                    <Eye className="w-4 h-4 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
                    title="Edytuj"
                  >
                    <Edit className="w-4 h-4 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </motion.button>
                </div>
              </div>
            ))}

            {goals.length === 0 && (
              <div className="text-center py-8 text-white/50">
                Nie masz jeszcze żadnych celów. Dodaj pierwszy cel, aby rozpocząć zbiórkę.
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Donations Tab */}
      {activeTab === 'donations' && (
        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Lista wpłat</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportDonations}
              className="px-4 py-2 glass rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-white"
            >
              <Download className="w-4 h-4" />
              Eksportuj CSV
            </motion.button>
          </div>

          <div className="text-center py-8 text-white/50">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            Lista wpłat będzie dostępna wkrótce
          </div>
        </GlassCard>
      )}

      {/* QR Codes Tab */}
      {activeTab === 'qr' && (
        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Kody QR</h2>
          </div>

          <div className="text-center py-8">
            <QrCode className="w-16 h-16 mx-auto mb-4 text-white/50" />
            <p className="text-white/60 mb-6">
              Wygeneruj kody QR dla swoich celów zbiórek
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateQRCodes}
              className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-lg text-white"
            >
              Pobierz PDF z kodami QR
            </motion.button>
          </div>
        </GlassCard>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <GlassCard hover={false}>
          <h2 className="text-xl font-bold text-white mb-6">Ustawienia organizacji</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-3">Informacje podstawowe</h3>
              <div className="space-y-3 text-white/70">
                <p>Nazwa: {organization?.name}</p>
                <p>NIP: {organization?.nip}</p>
                <p>Email: {organization?.email}</p>
                <p>Status: 
                  <span className="ml-2 px-2 py-1 rounded-lg text-sm bg-green-500/20 text-green-400">
                    Aktywna
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">Konfiguracja płatności</h3>
              <p className="text-white/70">
                Płatności są obsługiwane przez Fiserv/Polcard
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
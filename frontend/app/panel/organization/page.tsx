'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/glass-card'
import { formatCurrency } from '@/lib/utils'
import { 
  QrCode,
  Download,
  Eye,
  Users,
  Target,
  DollarSign,
  TrendingUp,
  FileText,
  LogOut,
  Plus,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react'

interface OrganizationData {
  id: string
  name: string
  slug: string
  email: string
  stats: {
    totalDonations: number
    totalAmount: number
    activeGoals: number
    totalGoals: number
  }
  goals: Array<{
    id: string
    name: string
    slug: string
    targetAmount: number
    currentAmount: number
    isActive: boolean
  }>
}

export default function OrganizationPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<OrganizationData | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'qrcodes' | 'reports' | 'settings'>('overview')
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('userRole')
    
    if (!token || role !== 'OrgOwner') {
      router.push('/admin/login')
    }
  }, [router])

  const loadOrganizationData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const orgId = localStorage.getItem('organizationId')
      
      if (!orgId) {
        setError('No organization ID found')
        return
      }

      // Load organization data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1.0'}/organizations/${orgId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load organization data')
      
      const data = await response.json()
      setOrganization(data)
    } catch (error) {
      console.error('Failed to load organization:', error)
      setError('Failed to load organization data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
    loadOrganizationData()
  }, [checkAuth, loadOrganizationData])

  const handleGenerateQRCodes = async () => {
    if (!organization) return
    
    setGenerating(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1.0'}/organizations/${organization.id}/qr-codes/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to generate QR codes')

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-codes-${organization.slug}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to generate QR codes:', err)
      setError('Failed to generate QR codes')
    } finally {
      setGenerating(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('organizationId')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Ładowanie panelu organizacji...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Błąd</h2>
          <p className="text-white/60 mb-4">{error || 'Nie udało się załadować danych organizacji'}</p>
          <button 
            onClick={() => router.push('/admin/login')}
            className="px-4 py-2 bg-accent-blue rounded-lg text-white hover:bg-accent-blue/80"
          >
            Powrót do logowania
          </button>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Panel Organizacji</h1>
          <p className="text-white/60">{organization.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-white hover:bg-white/10"
        >
          <LogOut className="w-4 h-4" />
          <span>Wyloguj</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {['overview', 'goals', 'qrcodes', 'reports', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'overview' | 'goals' | 'qrcodes' | 'reports' | 'settings')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-accent-blue text-white' 
                : 'glass text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab === 'overview' && 'Przegląd'}
            {tab === 'goals' && 'Cele zbiórki'}
            {tab === 'qrcodes' && 'Kody QR'}
            {tab === 'reports' && 'Raporty'}
            {tab === 'settings' && 'Ustawienia'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-accent-gold" />
              <span className="text-sm text-white/60">Miesiąc</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {formatCurrency(organization.stats.totalAmount)}
            </h3>
            <p className="text-white/60">Zebrane środki</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-accent-blue" />
              <span className="text-sm text-white/60">Łącznie</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {organization.stats.totalDonations}
            </h3>
            <p className="text-white/60">Liczba wpłat</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-accent-purple" />
              <span className="text-sm text-white/60">Aktywne</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {organization.stats.activeGoals}
            </h3>
            <p className="text-white/60">Cele zbiórki</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <span className="text-sm text-white/60">Wzrost</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              +23%
            </h3>
            <p className="text-white/60">W tym miesiącu</p>
          </GlassCard>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Cele zbiórki</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-blue rounded-lg text-white hover:bg-accent-blue/80">
              <Plus className="w-4 h-4" />
              <span>Dodaj cel</span>
            </button>
          </div>

          {organization.goals.map((goal) => (
            <GlassCard key={goal.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{goal.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                    <span>Cel: {formatCurrency(goal.targetAmount)}</span>
                    <span>Zebrano: {formatCurrency(goal.currentAmount)}</span>
                    <span className={goal.isActive ? 'text-green-400' : 'text-red-400'}>
                      {goal.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-accent-blue to-accent-purple h-2 rounded-full"
                      style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button className="p-2 glass rounded-lg hover:bg-white/10">
                    <Edit className="w-4 h-4 text-white" />
                  </button>
                  <button className="p-2 glass rounded-lg hover:bg-white/10">
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                  <button className="p-2 glass rounded-lg hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* QR Codes Tab */}
      {activeTab === 'qrcodes' && (
        <div className="max-w-2xl mx-auto">
          <GlassCard className="p-8 text-center">
            <QrCode className="w-24 h-24 text-accent-blue mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Generowanie kodów QR
            </h2>
            <p className="text-white/60 mb-8">
              Wygeneruj dokument PDF z kodami QR dla wszystkich aktywnych celów zbiórki.
              Kody można wydrukować i umieścić w widocznych miejscach.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleGenerateQRCodes}
                disabled={generating}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generowanie...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Pobierz PDF z kodami QR</span>
                  </>
                )}
              </button>
              
              <button className="w-full flex items-center justify-center gap-3 px-6 py-3 glass rounded-lg text-white hover:bg-white/10">
                <Eye className="w-5 h-5" />
                <span>Podgląd kodów</span>
              </button>
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Wskazówka:</strong> Każdy kod QR zawiera bezpośredni link do strony darowizny dla konkretnego celu.
                Darczyńcy mogą zeskanować kod telefonem i od razu przekazać darowiznę.
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <FileText className="w-8 h-8 text-accent-blue mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Raport miesięczny</h3>
            <p className="text-white/60 mb-4">Szczegółowe zestawienie wpłat z ostatniego miesiąca</p>
            <button className="flex items-center gap-2 text-accent-blue hover:text-accent-blue/80">
              <Download className="w-4 h-4" />
              <span>Pobierz PDF</span>
            </button>
          </GlassCard>

          <GlassCard className="p-6">
            <FileText className="w-8 h-8 text-accent-purple mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Export danych</h3>
            <p className="text-white/60 mb-4">Eksportuj wszystkie darowizny do pliku CSV</p>
            <button className="flex items-center gap-2 text-accent-purple hover:text-accent-purple/80">
              <Download className="w-4 h-4" />
              <span>Pobierz CSV</span>
            </button>
          </GlassCard>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ustawienia organizacji</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Nazwa organizacji</label>
                <input
                  type="text"
                  value={organization.name}
                  className="w-full px-4 py-2 glass rounded-lg text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Email kontaktowy</label>
                <input
                  type="email"
                  value={organization.email}
                  className="w-full px-4 py-2 glass rounded-lg text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Slug URL</label>
                <input
                  type="text"
                  value={organization.slug}
                  className="w-full px-4 py-2 glass rounded-lg text-white"
                  readOnly
                />
              </div>
              <button className="px-6 py-2 bg-accent-blue rounded-lg text-white hover:bg-accent-blue/80">
                Zapisz zmiany
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
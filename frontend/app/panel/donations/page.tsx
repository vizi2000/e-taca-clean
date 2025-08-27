'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { formatCurrency } from '@/lib/utils'
import { 
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Mail,
  User
} from 'lucide-react'
import Link from 'next/link'

interface Donation {
  id: string
  externalRef: string
  amount: number
  currency: string
  donorEmail: string
  donorName: string | null
  status: string
  createdAt: string
  paidAt: string | null
  goalTitle: string
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
}

interface DonationsResponse {
  donations: Donation[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export default function DonationsList() {
  const router = useRouter()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organizationId] = useState<string | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/admin/login')
      return
    }
  }, [router])

  const loadDonations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      
      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20'
      })
      
      if (statusFilter) params.append('status', statusFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await fetch(
        `/api/organizations/${organizationId}/donations?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data: DonationsResponse = await response.json()
        setDonations(data.donations)
        setTotalPages(data.totalPages)
        setTotalCount(data.totalCount)
      } else {
        setError('Nie udało się załadować wpłat')
      }
    } catch (err) {
      console.error('Failed to load donations:', err)
      setError('Błąd podczas ładowania wpłat')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, startDate, endDate, organizationId])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (organizationId) {
      loadDonations()
    }
  }, [organizationId, loadDonations])

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Build query params for export
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await fetch(
        `/api/organizations/${organizationId}/donations/export?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Failed to export donations:', err)
      setError('Nie udało się wyeksportować wpłat')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; class: string } } = {
      'paid': { text: 'Opłacona', class: 'bg-green-500/20 text-green-400' },
      'failed': { text: 'Nieudana', class: 'bg-red-500/20 text-red-400' },
      'pending': { text: 'Oczekuje', class: 'bg-yellow-500/20 text-yellow-400' },
      'cancelled': { text: 'Anulowana', class: 'bg-gray-500/20 text-gray-400' }
    }
    
    const config = statusMap[status.toLowerCase()] || statusMap['pending']
    
    return (
      <span className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${config.class}`}>
        {getStatusIcon(status)}
        {config.text}
      </span>
    )
  }

  // Filter donations based on search term
  const filteredDonations = donations.filter(donation => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      donation.donorEmail.toLowerCase().includes(term) ||
      donation.donorName?.toLowerCase().includes(term) ||
      donation.externalRef.toLowerCase().includes(term) ||
      donation.goalTitle.toLowerCase().includes(term)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Ładowanie wpłat...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/panel">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 glass rounded-xl hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Lista wpłat
              </h1>
              <p className="text-white/60">
                Wszystkie wpłaty do Twojej organizacji
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportCSV}
            className="px-6 py-3 glass rounded-xl text-white flex items-center gap-2 hover:bg-white/20 transition-colors"
          >
            <Download className="w-5 h-5" />
            Eksportuj CSV
          </motion.button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
      </header>

      {/* Filters */}
      <GlassCard hover={false} className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-white/60 text-sm mb-1 block">Szukaj</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Email, nazwa, nr ref..."
                className="w-full pl-10 pr-4 py-2 glass rounded-lg bg-transparent text-white placeholder-white/40"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="min-w-[150px]">
            <label className="text-white/60 text-sm mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 glass rounded-lg bg-transparent text-white"
            >
              <option value="">Wszystkie</option>
              <option value="0">Oczekujące</option>
              <option value="1">Opłacone</option>
              <option value="2">Nieudane</option>
              <option value="3">Anulowane</option>
            </select>
          </div>

          {/* Date range */}
          <div className="min-w-[150px]">
            <label className="text-white/60 text-sm mb-1 block">Od daty</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 glass rounded-lg bg-transparent text-white"
            />
          </div>

          <div className="min-w-[150px]">
            <label className="text-white/60 text-sm mb-1 block">Do daty</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 glass rounded-lg bg-transparent text-white"
            />
          </div>

          {/* Clear filters */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setStatusFilter('')
              setStartDate('')
              setEndDate('')
              setSearchTerm('')
            }}
            className="px-4 py-2 glass rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            <Filter className="w-4 h-4 inline mr-2" />
            Wyczyść
          </motion.button>
        </div>
      </GlassCard>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <GlassCard hover={false} className="text-center">
          <p className="text-white/60 text-sm mb-1">Całkowita liczba</p>
          <p className="text-2xl font-bold text-white">{totalCount}</p>
        </GlassCard>
        
        <GlassCard hover={false} className="text-center">
          <p className="text-white/60 text-sm mb-1">Opłacone</p>
          <p className="text-2xl font-bold text-green-400">
            {donations.filter(d => d.status.toLowerCase() === 'paid').length}
          </p>
        </GlassCard>
        
        <GlassCard hover={false} className="text-center">
          <p className="text-white/60 text-sm mb-1">Suma opłaconych</p>
          <p className="text-2xl font-bold gradient-text">
            {formatCurrency(
              donations
                .filter(d => d.status.toLowerCase() === 'paid')
                .reduce((sum, d) => sum + d.amount, 0)
            )}
          </p>
        </GlassCard>
        
        <GlassCard hover={false} className="text-center">
          <p className="text-white/60 text-sm mb-1">Strona</p>
          <p className="text-2xl font-bold text-white">{currentPage} / {totalPages}</p>
        </GlassCard>
      </div>

      {/* Donations Table */}
      <GlassCard hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/60 font-medium">Data</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Darczyńca</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Cel</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Kwota</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Ref</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((donation) => (
                <tr key={donation.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4">
                    <div className="text-white text-sm">
                      {new Date(donation.createdAt).toLocaleDateString('pl-PL')}
                    </div>
                    <div className="text-white/50 text-xs">
                      {new Date(donation.createdAt).toLocaleTimeString('pl-PL')}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {donation.donorName ? (
                        <>
                          <User className="w-4 h-4 text-white/50" />
                          <div>
                            <div className="text-white text-sm">{donation.donorName}</div>
                            <div className="text-white/50 text-xs">{donation.donorEmail}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-white/50" />
                          <div className="text-white text-sm">{donation.donorEmail}</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-white text-sm">{donation.goalTitle}</div>
                    {donation.utmSource && (
                      <div className="text-white/50 text-xs">
                        UTM: {donation.utmSource}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-white font-semibold">
                      {formatCurrency(donation.amount)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(donation.status)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-white/50 text-xs font-mono">
                      {donation.externalRef}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDonations.length === 0 && (
            <div className="text-center py-8 text-white/50">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Brak wpłat spełniających kryteria</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-2 glass rounded-lg ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/20'
              }`}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>

            <span className="text-white">
              Strona {currentPage} z {totalPages}
            </span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 glass rounded-lg ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/20'
              }`}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
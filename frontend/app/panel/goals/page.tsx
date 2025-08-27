'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { formatCurrency } from '@/lib/utils'
import { apiEndpoint } from '@/lib/api/config'
import { 
  Target,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  QrCode,
  Copy
} from 'lucide-react'
import Link from 'next/link'

interface Goal {
  id?: string
  title: string
  description: string
  targetAmount: number
  slug?: string
  isActive: boolean
}

export default function GoalsManagement() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizationSlug, setOrganizationSlug] = useState<string | null>(null)

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/admin/login')
      return
    }
  }, [router])

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      
      // First get organization ID
      const orgResponse = await fetch(apiEndpoint('/organizations/my'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganizationId(orgData.id)
        setOrganizationSlug(orgData.slug)
        
        // Then load goals (including inactive ones for admin panel)
        const goalsResponse = await fetch(apiEndpoint(`/organizations/${orgData.id}/goals?includeInactive=true`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json()
          setGoals(goalsData)
        }
      } else {
        setError('Nie udało się załadować organizacji')
      }
    } catch (error) {
      console.error('Failed to load goals:', error)
      setError('Nie udało się załadować celów')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
    loadGoals()
  }, [checkAuth, loadGoals])

  const handleSaveGoal = async (goal: Goal) => {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      
      const url = goal.id 
        ? apiEndpoint(`/organizations/${organizationId}/goals/${goal.id}`)
        : apiEndpoint(`/organizations/${organizationId}/goals`)
      
      const method = goal.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: goal.title,
          description: goal.description,
          targetAmount: goal.targetAmount,
          isActive: goal.isActive
        })
      })

      if (response.ok) {
        setSuccess(goal.id ? 'Cel został zaktualizowany' : 'Cel został dodany')
        setEditingGoal(null)
        setShowAddForm(false)
        await loadGoals()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Nie udało się zapisać celu')
      }
    } catch (err) {
      console.error('Failed to save goal:', err)
      setError('Wystąpił błąd podczas zapisywania')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten cel?')) {
      return
    }

    try {
      setError(null)
      const token = localStorage.getItem('token')
      
      const response = await fetch(apiEndpoint(`/organizations/${organizationId}/goals/${goalId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Cel został usunięty')
        await loadGoals()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError('Nie udało się usunąć celu')
      }
    } catch (err) {
      console.error('Failed to delete goal:', err)
      setError('Wystąpił błąd podczas usuwania')
    }
  }

  const handleGenerateQR = async (goalId: string) => {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      
      const response = await fetch(apiEndpoint(`/organizations/${organizationId}/goals/${goalId}/qr-code`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qr-goal-${goalId}.png`
        a.click()
        window.URL.revokeObjectURL(url)
        setSuccess('Kod QR został pobrany')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError('Nie udało się wygenerować kodu QR')
      }
    } catch (err) {
      console.error('Failed to generate QR:', err)
      setError('Wystąpił błąd podczas generowania kodu QR')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Ładowanie...</div>
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
                Zarządzanie celami
              </h1>
              <p className="text-white/60">
                Możesz mieć maksymalnie 3 aktywne cele
              </p>
            </div>
          </div>

          {goals.length < 3 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-white flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Dodaj cel
            </motion.button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}
      </header>

      {/* Goals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <GlassCard key={goal.id} hover={false}>
            {editingGoal?.id === goal.id ? (
              // Edit Form
              <form onSubmit={(e) => {
                e.preventDefault()
                if (editingGoal) {
                  handleSaveGoal(editingGoal)
                }
              }}>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editingGoal?.title || ''}
                    onChange={(e) => setEditingGoal(editingGoal ? {...editingGoal, title: e.target.value} : null)}
                    placeholder="Tytuł celu"
                    required
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                  <textarea
                    value={editingGoal?.description || ''}
                    onChange={(e) => setEditingGoal(editingGoal ? {...editingGoal, description: e.target.value} : null)}
                    placeholder="Opis celu"
                    required
                    rows={3}
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                  <input
                    type="number"
                    value={editingGoal?.targetAmount || 0}
                    onChange={(e) => setEditingGoal(editingGoal ? {...editingGoal, targetAmount: Number(e.target.value)} : null)}
                    placeholder="Kwota docelowa"
                    min="1"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={editingGoal?.isActive || false}
                      onChange={(e) => setEditingGoal(editingGoal ? {...editingGoal, isActive: e.target.checked} : null)}
                      className="w-4 h-4"
                    />
                    Aktywny
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white"
                    >
                      <Save className="w-4 h-4 inline mr-1" />
                      Zapisz
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGoal(null)}
                      className="flex-1 py-2 glass rounded-lg text-white"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Anuluj
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              // Display Mode
              <>
                <div className="mb-4">
                  <div className="w-12 h-12 glass rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{goal.title}</h3>
                  <p className="text-white/70 text-sm">{goal.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Cel</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Status</span>
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      goal.isActive 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {goal.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </div>

                  {goal.slug && organizationSlug && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-white/60 text-xs mb-1">Link do celu:</p>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/${organizationSlug}/${goal.slug}`}
                          target="_blank"
                          className="text-blue-400 hover:text-blue-300 text-xs break-all underline flex items-center gap-1"
                        >
                          /{organizationSlug}/{goal.slug}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </Link>
                        <button
                          onClick={() => {
                            const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${organizationSlug}/${goal.slug}`
                            navigator.clipboard.writeText(fullUrl)
                            setSuccess('Link skopiowany!')
                            setTimeout(() => setSuccess(null), 2000)
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                          title="Kopiuj pełny link"
                        >
                          <Copy className="w-3 h-3 text-white/60 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingGoal(goal)}
                      className="flex-1 py-2 glass rounded-lg text-white hover:bg-white/20 transition-colors"
                    >
                      <Edit className="w-4 h-4 inline mr-1" />
                      Edytuj
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteGoal(goal.id!)}
                      className="flex-1 py-2 glass rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Usuń
                    </motion.button>
                  </div>
                  {goal.slug && organizationId && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleGenerateQR(goal.id!)}
                      className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white hover:from-purple-600 hover:to-blue-600 transition-colors"
                    >
                      <QrCode className="w-4 h-4 inline mr-1" />
                      Generuj kod QR
                    </motion.button>
                  )}
                </div>
              </>
            )}
          </GlassCard>
        ))}

        {/* Add New Goal Form */}
        {showAddForm && (
          <GlassCard hover={false}>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleSaveGoal({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                targetAmount: Number(formData.get('targetAmount')),
                isActive: formData.get('isActive') === 'on'
              })
            }}>
              <h3 className="text-xl font-bold text-white mb-4">Nowy cel</h3>
              <div className="space-y-4">
                <input
                  name="title"
                  type="text"
                  placeholder="Tytuł celu"
                  required
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
                <textarea
                  name="description"
                  placeholder="Opis celu"
                  required
                  rows={3}
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
                <input
                  name="targetAmount"
                  type="number"
                  placeholder="Kwota docelowa (PLN)"
                  min="1"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                />
                <label className="flex items-center gap-2 text-white">
                  <input
                    name="isActive"
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4"
                  />
                  Aktywny od razu
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white"
                  >
                    <Save className="w-4 h-4 inline mr-1" />
                    Dodaj
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 glass rounded-lg text-white"
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Anuluj
                  </button>
                </div>
              </div>
            </form>
          </GlassCard>
        )}
      </div>

      {/* Empty State */}
      {goals.length === 0 && !showAddForm && (
        <div className="text-center py-16">
          <Target className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 text-lg mb-6">
            Nie masz jeszcze żadnych celów zbiórek
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-white"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Dodaj pierwszy cel
          </motion.button>
        </div>
      )}
    </div>
  )
}
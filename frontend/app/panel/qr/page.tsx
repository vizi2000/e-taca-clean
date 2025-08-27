'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { apiEndpoint } from '@/lib/api/config'
import { 
  QrCode,
  Download,
  ArrowLeft,
  Copy,
  CheckCircle,
  ExternalLink,
  Smartphone,
  Printer
} from 'lucide-react'
import Link from 'next/link'

interface Goal {
  id: string
  title: string
  slug: string
}

interface Organization {
  id: string
  name: string
  slug: string
  email?: string
}

export default function QRCodeManager() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<string>('organization')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/admin/login')
    }
  }, [router])

  const loadData = useCallback(async () => {
    try {
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
        
        // Load goals
        const goalsResponse = await fetch(apiEndpoint(`/organizations/${orgData.id}/goals`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json()
          setGoals(goalsData)
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
    loadData()
  }, [checkAuth, loadData])

  const getQRCodeUrl = (goalSlug?: string) => {
    if (!organization) return ''
    const baseUrl = window.location.origin
    if (goalSlug) {
      return `${baseUrl}/${organization.slug}/${goalSlug}`
    }
    return `${baseUrl}/${organization.slug}`
  }

  const getQRCodeApiUrl = (goalId?: string) => {
    if (!organization) return ''
    if (goalId && goalId !== 'organization') {
      return apiEndpoint(`/organizations/${organization.id}/goals/${goalId}/qr-code`)
    }
    return apiEndpoint(`/organizations/${organization.id}/qr-code`)
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const handleDownloadQR = async (goalId?: string) => {
    if (!organization) return
    
    const token = localStorage.getItem('token')
    const url = getQRCodeApiUrl(goalId)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `qr-${organization.slug}${goalId ? `-${goalId}` : ''}.png`
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
    }
  }

  const handleDownloadAllQRCodes = async () => {
    if (!organization) return
    
    const token = localStorage.getItem('token')
    const response = await fetch(apiEndpoint(`/admin/pdf/qrcodes/${organization.id}`), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr_codes_${organization.slug}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Ładowanie...</div>
      </div>
    )
  }

  const selectedGoalData = goals.find(g => g.id === selectedGoal)
  const currentUrl = selectedGoal === 'organization' 
    ? getQRCodeUrl() 
    : getQRCodeUrl(selectedGoalData?.slug)

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
                Kody QR
              </h1>
              <p className="text-white/60">
                Generuj i pobieraj kody QR dla swoich celów
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadAllQRCodes}
            className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-white flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Pobierz wszystkie (PDF)
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Selection */}
        <GlassCard hover={false}>
          <h3 className="text-xl font-bold text-white mb-4">Wybierz cel</h3>
          
          <div className="space-y-2">
            {/* Organization QR */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedGoal('organization')}
              className={`w-full p-3 rounded-lg text-left transition-all ${
                selectedGoal === 'organization'
                  ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              <div className="font-semibold">Strona organizacji</div>
              <div className="text-sm opacity-70">Główna strona z wszystkimi celami</div>
            </motion.button>

            {/* Goals QR */}
            {goals.map((goal) => (
              <motion.button
                key={goal.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedGoal(goal.id)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedGoal === goal.id
                    ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                    : 'glass text-white/70 hover:text-white'
                }`}
              >
                <div className="font-semibold">{goal.title}</div>
                <div className="text-sm opacity-70">Bezpośredni link do celu</div>
              </motion.button>
            ))}
          </div>
        </GlassCard>

        {/* QR Code Preview */}
        <GlassCard hover={false} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Podgląd kodu QR</h3>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDownloadQR(selectedGoal === 'organization' ? undefined : selectedGoal)}
                className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
                title="Pobierz PNG"
              >
                <Download className="w-5 h-5 text-white" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.print()}
                className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
                title="Drukuj"
              >
                <Printer className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Code Display */}
            <div className="flex flex-col items-center">
              <div className="w-64 h-64 bg-white rounded-xl p-4 mb-4">
                {/* QR Code Placeholder - in real app, this would be generated */}
                <div className="w-full h-full flex items-center justify-center">
                  <QrCode className="w-48 h-48 text-gray-800" />
                </div>
              </div>
              
              <p className="text-white/60 text-sm text-center">
                {selectedGoal === 'organization' 
                  ? 'Kod QR dla strony organizacji'
                  : `Kod QR dla: ${selectedGoalData?.title}`
                }
              </p>
            </div>

            {/* QR Code Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-semibold mb-2">Link docelowy:</h4>
                <div className="glass rounded-lg p-3 flex items-center justify-between">
                  <p className="text-white/80 text-sm truncate flex-1">
                    {currentUrl}
                  </p>
                  <div className="flex gap-2 ml-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCopyUrl(currentUrl)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Kopiuj link"
                    >
                      {copiedUrl === currentUrl ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/60" />
                      )}
                    </motion.button>
                    <motion.a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Otwórz link"
                    >
                      <ExternalLink className="w-4 h-4 text-white/60" />
                    </motion.a>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">Jak używać:</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-white/60 mt-0.5" />
                    <p className="text-white/70 text-sm">
                      Darczyńcy mogą zeskanować kod telefonem, aby przejść bezpośrednio do strony wpłat
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Printer className="w-5 h-5 text-white/60 mt-0.5" />
                    <p className="text-white/70 text-sm">
                      Wydrukuj kod i umieść w widocznym miejscu w kościele lub na materiałach promocyjnych
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Download className="w-5 h-5 text-white/60 mt-0.5" />
                    <p className="text-white/70 text-sm">
                      Pobierz jako PNG do wykorzystania w materiałach cyfrowych
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">Rozmiary do pobrania:</h4>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-2 glass rounded-lg text-white/70 hover:text-white text-sm"
                  >
                    Mały (200x200)
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-2 glass rounded-lg text-white/70 hover:text-white text-sm"
                  >
                    Średni (400x400)
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-2 glass rounded-lg text-white/70 hover:text-white text-sm"
                  >
                    Duży (800x800)
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Instructions Card */}
      <GlassCard hover={false} className="mt-6">
        <h3 className="text-xl font-bold text-white mb-4">Wskazówki</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-white/80 font-semibold mb-2">Gdzie umieścić?</h4>
            <ul className="text-white/60 text-sm space-y-1">
              <li>• Przy wejściu do kościoła</li>
              <li>• Na tablicy ogłoszeń</li>
              <li>• W biuletynie parafialnym</li>
              <li>• Na stronie internetowej</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white/80 font-semibold mb-2">Zalecane rozmiary</h4>
            <ul className="text-white/60 text-sm space-y-1">
              <li>• Ulotka: 5x5 cm</li>
              <li>• Plakat: 15x15 cm</li>
              <li>• Baner: 30x30 cm</li>
              <li>• Strona www: 200x200 px</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white/80 font-semibold mb-2">Dobre praktyki</h4>
            <ul className="text-white/60 text-sm space-y-1">
              <li>• Dodaj krótki opis obok kodu</li>
              <li>• Upewnij się, że kod jest czytelny</li>
              <li>• Testuj przed drukowaniem</li>
              <li>• Aktualizuj regularnie</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
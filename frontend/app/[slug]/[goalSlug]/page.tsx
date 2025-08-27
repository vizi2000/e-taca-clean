'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatCurrency } from '@/lib/utils'
import { type Goal } from '@/lib/api'
import { ArrowLeft, Heart, CreditCard, User, Mail, MessageSquare } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api-config'
import Link from 'next/link'
import { DivineBackground } from '@/components/ui/divine-background'
import { InteractiveParticles } from '@/components/ui/interactive-particles'
import { ButtonFlash } from '@/components/ui/button-flash'
import { SpiritualQuotes } from '@/components/ui/spiritual-quotes'

import { apiEndpoint } from '@/lib/api/config'
const PRESET_AMOUNTS = [20, 50, 100, 200, 500]

export default function DonationPage({ 
  params 
}: { 
  params: { slug: string; goalSlug: string } 
}) {
  const { slug, goalSlug } = params
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadGoal = useCallback(async () => {
    try {
      // Fetch organization data with goals
      const response = await fetch(`${API_BASE_URL}/organizations/by-slug/${slug}`)
      if (!response.ok) {
        throw new Error('Failed to fetch organization')
      }
      
      const data = await response.json()

      interface ApiGoal {
        id: string
        organizationId: string
        title: string
        description: string
        targetAmount: number
        collectedAmount: number
        imageUrl?: string
        slug: string
        isActive: boolean
      }

      // Find the specific goal by slug
      const foundGoal = data.goals?.find((g: ApiGoal) => g.slug === goalSlug)
      
      if (foundGoal) {
        // Map to our Goal type
        const mappedGoal: Goal = {
          id: foundGoal.id,
          organizationId: data.id, // Use organization ID from the main response
          name: foundGoal.title,
          description: foundGoal.description,
          targetAmount: foundGoal.targetAmount,
          currentAmount: foundGoal.collectedAmount,
          imageUrl: foundGoal.imageUrl,
          slug: foundGoal.slug,
          isActive: foundGoal.isActive
        }
        setGoal(mappedGoal)
      }
    } catch (error) {
      console.error('Failed to load goal:', error)
    } finally {
      setLoading(false)
    }
  }, [slug, goalSlug])

  useEffect(() => {
    loadGoal()
  }, [loadGoal])


  async function handleSubmit() {
    if (!goal || processing) return

    const amount = selectedAmount || Number(customAmount)
    if (!amount || amount <= 0) return

    setProcessing(true)

    try {
      const response = await fetch(apiEndpoint('/donations/initiate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: goal.organizationId,
          goalId: goal.id,
          amount,
          donorName: donorName || '',
          donorEmail: donorEmail || 'anonymous@example.com',
          consent: true,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to initiate donation')
      }

      const result = await response.json()
      
      // Create a temporary div to render the form HTML
      const div = document.createElement('div')
      div.innerHTML = result.paymentFormHtml
      document.body.appendChild(div)
      
      // Find the form and manually submit it
      console.log('Payment form HTML:', result.paymentFormHtml)
      const paymentForm = div.querySelector('form') as HTMLFormElement | null
      console.log('Found form element:', paymentForm)
      
      if (paymentForm) {
        console.log('Submitting form to:', paymentForm.action)
        paymentForm.submit()
      } else {
        // Fallback: try to find the form by ID
        const formById = document.getElementById('payment-form') as HTMLFormElement | null
        console.log('Fallback form by ID:', formById)
        if (formById) {
          console.log('Submitting fallback form to:', formById.action)
          formById.submit()
        } else {
          console.error('No payment form found!')
          alert('Błąd przekierowania do płatności. Spróbuj ponownie.')
          setProcessing(false)
        }
      }
    } catch (error) {
      console.error('Error creating donation:', error)
      alert('Wystąpił błąd. Spróbuj ponownie.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl loading-dots">Ładowanie</div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Cel nie znaleziony</div>
      </div>
    )
  }

  const finalAmount = selectedAmount || Number(customAmount) || 0

  return (
    <div className="min-h-screen relative py-12 px-6">
      {/* Enhanced spiritual effects */}
      <DivineBackground />
      <InteractiveParticles />
      <SpiritualQuotes />
      
      {/* Back Button */}
      <Link href={`/${slug}`}>
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-8 left-8 z-20 glass rounded-full p-3 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </motion.button>
      </Link>

      <div className="max-w-5xl mx-auto">
        {/* Goal Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 glass rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {goal.name}
          </h1>
          {goal.description && (
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              {goal.description}
            </p>
          )}
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="panel-enter"
        >
        <GlassCard className="mb-8 max-w-2xl mx-auto" hover={false}>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-white/60">
              <span>Zebrano</span>
              <span>Cel</span>
            </div>
            <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
            <div className="flex justify-between">
              <div className="text-2xl font-bold gradient-text">
                {formatCurrency(goal.currentAmount)}
              </div>
              <div className="text-xl text-white/80">
                {formatCurrency(goal.targetAmount)}
              </div>
            </div>
          </div>
        </GlassCard>
        </motion.div>

        {/* Donation Form */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Amount Selection */}
            <GlassCard hover={false} delay={0.1}>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <CreditCard className="w-6 h-6" />
                Złóż ofiarę
              </h2>

              <div className="space-y-4">
                <label className="text-white/70 text-sm">Wybierz kwotę</label>
                
                {/* Preset Amounts */}
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_AMOUNTS.map((amount) => (
                    <ButtonFlash
                      key={amount}
                      onClick={() => {
                        setSelectedAmount(amount)
                        setCustomAmount('')
                      }}
                      className={`py-3 rounded-xl font-semibold transition-all ${
                        selectedAmount === amount
                          ? 'bg-gradient-to-r from-basilica-blue to-basilica-light text-white'
                          : 'glass hover:bg-white/20 text-white'
                      }`}
                    >
                      {amount} zł
                    </ButtonFlash>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="text-white/70 text-sm">Inna kwota</label>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value)
                      setSelectedAmount(null)
                    }}
                    placeholder="Wpisz kwotę"
                    className="w-full mt-2 px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                </div>
              </div>
            </GlassCard>

            {/* Donor Information */}
            <GlassCard hover={false} delay={0.2}>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <User className="w-6 h-6" />
                Dane darczyńcy (opcjonalne)
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-white/70 text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Imię i nazwisko
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Jan Kowalski"
                    className="w-full mt-2 px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-white/70 text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="jan@example.com"
                    autoComplete="email"
                    className="w-full mt-2 px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-white/70 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Wiadomość
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Wpisz swoją intencję lub wiadomość..."
                    rows={3}
                    className="w-full mt-2 px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Submit Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            {finalAmount > 0 && (
              <div className="text-center mb-6">
                <p className="text-white/70 mb-2">Kwota darowizny:</p>
                <p className="text-4xl font-bold gradient-text">
                  {formatCurrency(finalAmount)}
                </p>
              </div>
            )}

            <ButtonFlash
              onClick={handleSubmit}
              disabled={!finalAmount || finalAmount <= 0 || processing}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                finalAmount > 0 && !processing
                  ? 'bg-gradient-to-r from-basilica-blue via-basilica-light to-basilica-gold text-white hover:shadow-lg hover:shadow-basilica-light/50'
                  : 'glass text-white/50 cursor-not-allowed'
              }`}
            >
              {processing ? (
                <span className="loading-dots">Przetwarzanie</span>
              ) : (
                'Przejdź do płatności'
              )}
            </ButtonFlash>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-white/50 text-sm">
              <CreditCard className="w-4 h-4" />
              <span>Bezpieczne płatności</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
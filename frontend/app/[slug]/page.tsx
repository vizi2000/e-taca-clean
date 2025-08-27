'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { type Organization, type Goal } from '@/lib/api'
import { Church, Target } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api-config'
import Link from 'next/link'
import { SpiritualQuotes } from '@/components/ui/spiritual-quotes'
import { DivineBackground } from '@/components/ui/divine-background'
import { InteractiveParticles } from '@/components/ui/interactive-particles'
import { ButtonFlash } from '@/components/ui/button-flash'

export default function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      // Fetch real data from API
      const response = await fetch(`${API_BASE_URL}/organizations/by-slug/${slug}`)
      if (!response.ok) {
        throw new Error('Failed to fetch organization')
      }
      
      const data = await response.json()

      interface ApiGoal {
        id: string;
        title: string;
        description: string;
        targetAmount: number;
        slug: string;
        imageUrl: string;
        collectedAmount: number;
      }
      
      // Transform API response to match frontend types
      const org: Organization = {
        id: data.id,
        name: data.name,
        slug: slug,
        description: 'Parafia rzymskokatolicka - wspólnota wiary i modlitwy',
        imageUrl: data.heroImageUrl || '/basilica-bg.jpg',
        totalRaised: data.goals.reduce((sum: number, g: ApiGoal) => sum + g.collectedAmount, 0),
        goalTarget: data.goals.reduce((sum: number, g: ApiGoal) => sum + g.targetAmount, 0),
      }
      
      const goals: Goal[] = data.goals.map((g: ApiGoal) => ({
        id: g.id,
        organizationId: data.id,
        name: g.title,
        description: g.description,
        targetAmount: g.targetAmount,
        currentAmount: g.collectedAmount,
        slug: g.slug,
        isActive: true,
      }))
      
      setOrganization(org)
      setGoals(goals)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl loading-dots">Ładowanie</div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Organizacja nie znaleziona</div>
      </div>
    )
  }

  const overallProgress = (organization.totalRaised / organization.goalTarget) * 100

  return (
    <div className="min-h-screen relative">
      {/* Enhanced spiritual effects */}
      <DivineBackground />
      <InteractiveParticles />
      <SpiritualQuotes />
      
      {/* Hero Section with Organization Info */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background with Basilica Image */}
        <div className="absolute inset-0">
          {/* Basilica background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Mikolow_Bazylika_sw_Wojciecha_2.jpg/1280px-Mikolow_Bazylika_sw_Wojciecha_2.jpg')`,
              filter: 'brightness(0.7) contrast(1.1)'
            }}
          />
          {/* Gradient overlays for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/80 via-midnight/60 to-midnight/90" />
          <div className="absolute inset-0 bg-gradient-basilica opacity-30" />
        </div>

        {/* Floating Organization Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 max-w-2xl mx-auto px-6"
        >
          <div className="glass-heavy rounded-3xl p-8 text-center eternal-glow">
            {/* Logo/Icon */}
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 glass rounded-full flex items-center justify-center"
            >
              <Church className="w-12 h-12 text-basilica-gold" />
            </motion.div>

            {/* Organization Name */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {organization.name}
            </h1>
            
            {/* Description */}
            {organization.description && (
              <p className="text-lg text-white/80 mb-6">
                {organization.description}
              </p>
            )}

            {/* Overall Progress */}
            <div className="mt-8">
              <h3 className="text-sm text-white/60 mb-2">Wybierz cel:</h3>
            </div>
          </div>
        </motion.div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 100 
              }}
              animate={{ 
                y: -100,
                transition: {
                  duration: Math.random() * 20 + 10,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* Goals Grid Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {goals.map((goal, index) => (
              <Link href={`/${slug}/${goal.slug}`} key={goal.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.6,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                  whileHover={{ scale: 1.02 }}
                  className="panel-enter"
                >
                <GlassCard
                  delay={index * 0.1}
                  className="group relative overflow-hidden h-full"
                  glow
                >
                  {/* Goal Icon */}
                  <div className="mb-6">
                    <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Goal Name */}
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {goal.name}
                  </h3>

                  {/* Goal Description */}
                  {goal.description && (
                    <p className="text-white/70 mb-6 line-clamp-2">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress Section */}
                  <div className="space-y-4">
                    {/* Labels */}
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Zebrano</span>
                      <span className="text-white/60">Cel</span>
                    </div>

                    {/* Progress Bar */}
                    <ProgressBar 
                      value={goal.currentAmount} 
                      max={goal.targetAmount}
                      animated
                    />

                    {/* Amounts */}
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-2xl font-bold gradient-text">
                          {formatCurrency(goal.currentAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg text-white/80">
                          {formatCurrency(goal.targetAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Support Button */}
                    <ButtonFlash
                      className="w-full py-3 glass-heavy rounded-xl text-white font-semibold hover:bg-white/30 transition-colors duration-300"
                    >
                      Wesprzyj
                    </ButtonFlash>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-accent-purple/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </GlassCard>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Overall Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20 glass-heavy rounded-3xl p-8"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Razem pomagamy
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Total Raised */}
              <div className="text-center">
                <div className="text-5xl font-bold gradient-text mb-2">
                  {formatCurrency(organization.totalRaised)}
                </div>
                <div className="text-white/60">Zebrane środki</div>
              </div>

              {/* Progress Percentage */}
              <div className="text-center">
                <div className="text-5xl font-bold text-accent-gold mb-2">
                  {formatPercent(overallProgress)}
                </div>
                <div className="text-white/60">Realizacji celów</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 text-center text-white/50 text-sm">
        <div className="glass-light mx-auto max-w-md rounded-full py-3 px-6">
          © E-Taca 2024 | Bezpieczne płatności
        </div>
      </footer>
    </div>
  )
}
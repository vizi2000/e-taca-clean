'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { Lock, Mail, LogIn, Building, HelpCircle } from 'lucide-react'
import { apiEndpoints } from '@/lib/api-config'
import Link from 'next/link'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(apiEndpoints.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        // Store token and user info in localStorage (in production, use httpOnly cookies)
        localStorage.setItem('token', data.token)
        localStorage.setItem('userEmail', data.email)
        localStorage.setItem('userRole', data.role)
        localStorage.setItem('organizationId', data.organizationId || '')
        
        // Redirect based on user role
        if (data.role === 'OrgOwner') {
          router.push('/panel')
        } else {
          router.push('/admin')
        }
      } else {
        setError('Nieprawidłowy email lub hasło')
      }
    } catch {
      setError('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard>
          <div className="text-center mb-8">
            <div className="w-20 h-20 glass rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Panel Administracyjny</h1>
            <p className="text-white/60">Zaloguj się do panelu zarządzania</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            <div>
              <label htmlFor="email" className="text-white/70 text-sm flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@etaca.pl"
                required
                autoComplete="username"
                className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-white/70 text-sm flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                Hasło
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 glass border border-red-500/30 rounded-xl"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'glass text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-basilica-blue to-basilica-light text-white hover:shadow-lg hover:shadow-basilica-light/50'
              }`}
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </motion.button>
          </form>

          <div className="mt-6 space-y-4">
            <Link href="/reset-password">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 inline mr-2" />
                Zapomniałem hasła
              </motion.div>
            </Link>

            <div className="pt-4 border-t border-white/10">
              <Link href="/register-organization">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass p-4 rounded-xl text-center hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Building className="w-6 h-6 text-white mb-2 mx-auto" />
                  <p className="text-white font-semibold">Zarejestruj swoją organizację</p>
                  <p className="text-white/60 text-sm mt-1">
                    Dołącz do systemu e-Taca i zacznij przyjmować cyfrowe wpłaty
                  </p>
                </motion.div>
              </Link>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
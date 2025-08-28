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
      // Get CSRF token from cookie
      const getCsrfToken = () => {
        const cookies = document.cookie.split(';')
        const csrfCookie = cookies.find(c => c.trim().startsWith('XSRF-TOKEN='))
        return csrfCookie ? csrfCookie.split('=')[1] : ''
      }

      const response = await fetch(apiEndpoints.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        // Store only user info in sessionStorage (more secure than localStorage)
        sessionStorage.setItem('userEmail', data.email)
        sessionStorage.setItem('userRole', data.role)
        sessionStorage.setItem('organizationId', data.organizationId || '')
        
        // Redirect based on user role
        if (data.role === 'OrgOwner') {
          router.push('/panel')
        } else {
          router.push('/admin')
        }
      } else {
        // Use generic error message to prevent user enumeration
        setError('Nieprawidłowe dane logowania')
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
            <p className="text-white/40 text-sm mt-2">Uzyskaj dostęp do zarządzania organizacją i wpłatami</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on" method="post" aria-label="Formularz logowania">
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
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                aria-label="Adres email"
                aria-required="true"
                aria-invalid={error ? true : false}
                aria-describedby={error ? 'error-message' : undefined}
                className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-transparent"
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
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                aria-label="Hasło"
                aria-required="true"
                aria-invalid={error ? true : false}
                className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-transparent"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 glass border border-red-500/30 rounded-xl"
                role="alert"
                aria-live="polite"
                id="error-message"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              aria-busy={loading}
              aria-label={loading ? 'Logowanie w toku' : 'Zaloguj się'}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-transparent ${
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
            <Link href="/reset-password" aria-label="Resetuj hasło">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-center text-white/70 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-transparent rounded-lg p-2"
              >
                <HelpCircle className="w-4 h-4 inline mr-2" />
                Nie pamiętasz hasła?
                <span className="block text-xs text-white/40 mt-1">Wyślemy link do ustawienia nowego hasła</span>
              </motion.div>
            </Link>

            <div className="pt-4 border-t border-white/10">
              <Link href="/register-organization" aria-label="Zarejestruj nową organizację">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass p-4 rounded-xl text-center hover:bg-white/10 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-accent-purple focus-within:ring-offset-2 focus-within:ring-offset-transparent"
                >
                  <Building className="w-6 h-6 text-white mb-2 mx-auto" />
                  <p className="text-white font-semibold">Nowa organizacja?</p>
                  <p className="text-white/60 text-sm mt-1">
                    Dołącz do systemu e-Taca i przyjmuj cyfrowe wpłaty
                  </p>
                  <p className="text-white/40 text-xs mt-2">
                    Utwórz konto organizacji i administratora
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
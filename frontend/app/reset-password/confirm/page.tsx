'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { apiEndpoint } from '@/lib/api/config'
import { 
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Key
} from 'lucide-react'
import Link from 'next/link'

function ResetPasswordConfirmContent() {
  const searchParams = useSearchParams()
  // const router = useRouter() // Kept for potential future navigation
  const [token, setToken] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')
    
    if (!tokenParam || !emailParam) {
      setError('Nieprawidłowy link resetowania hasła')
      setValidating(false)
      return
    }
    
    setToken(tokenParam)
    setEmail(emailParam)
    validateToken()
  }, [searchParams])

  const validateToken = async () => {
    try {
      // Here you would validate the token with the backend
      // For now, we'll assume it's valid
      setValidating(false)
    } catch {
      setError('Link resetowania hasła wygasł lub jest nieprawidłowy')
      setValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!password || !confirmPassword) {
      setError('Wszystkie pola są wymagane')
      return
    }
    
    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(apiEndpoint('/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          token,
          newPassword: password
        })
      })
      
      if (response.ok) {
        setSuccess(true)
      } else {
        const data = await response.json()
        setError(data.message || 'Nie udało się zresetować hasła')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setError('Wystąpił błąd. Spróbuj ponownie później.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full text-center">
          <div className="animate-pulse">
            <p className="text-white">Weryfikacja linku...</p>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Hasło zostało zmienione!
          </h2>
          <p className="text-white/70 mb-6">
            Twoje hasło zostało pomyślnie zmienione. Możesz teraz zalogować się używając nowego hasła.
          </p>
          <Link href="/admin/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-basilica-blue to-basilica-light rounded-xl text-white"
            >
              Przejdź do logowania
            </motion.button>
          </Link>
        </GlassCard>
      </div>
    )
  }

  if (error && validating === false && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Nieprawidłowy link
          </h2>
          <p className="text-white/70 mb-6">
            {error}
          </p>
          <Link href="/reset-password">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 glass rounded-xl text-white hover:bg-white/20 transition-colors"
            >
              Poproś o nowy link
            </motion.button>
          </Link>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard hover={false}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-basilica-blue to-basilica-light rounded-full flex items-center justify-center mx-auto mb-6">
              <Key className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Ustaw nowe hasło
            </h1>
            <p className="text-white/70">
              Wprowadź nowe hasło dla konta: {email}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-white/70 text-sm mb-2 block flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Nowe hasło
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 znaków"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple disabled:opacity-50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Potwierdź nowe hasło
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Powtórz hasło"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple disabled:opacity-50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="glass rounded-lg p-3">
              <p className="text-white/60 text-sm mb-2">Wymagania hasła:</p>
              <ul className="text-white/50 text-xs space-y-1">
                <li className={password.length >= 8 ? 'text-green-400' : ''}>
                  • Minimum 8 znaków
                </li>
                <li className={password === confirmPassword && password !== '' ? 'text-green-400' : ''}>
                  • Hasła muszą być identyczne
                </li>
              </ul>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                loading
                  ? 'glass text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-basilica-blue via-basilica-light to-basilica-gold text-white hover:shadow-lg hover:shadow-basilica-light/50'
              }`}
            >
              {loading ? (
                <span className="loading-dots">Zmienianie hasła</span>
              ) : (
                'Zmień hasło'
              )}
            </motion.button>

            {/* Links */}
            <div className="text-center">
              <Link href="/admin/login">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="text-white/70 hover:text-white transition-colors inline-block"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-1" />
                  Powrót do logowania
                </motion.span>
              </Link>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  )
}

export default function ResetPasswordConfirm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Ładowanie...</div>
      </div>
    }>
      <ResetPasswordConfirmContent />
    </Suspense>
  )
}
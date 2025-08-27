'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { apiEndpoint } from '@/lib/api/config'
import { 
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Lock,
  Send
} from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordRequest() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Wprowadź adres email')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      await fetch(apiEndpoint('/auth/request-password-reset'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })
      
      // Always show success to prevent email enumeration
      setSuccess(true)
    } catch (err) {
      console.error('Password reset request error:', err)
      setError('Wystąpił błąd. Spróbuj ponownie później.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Email wysłany!
          </h2>
          <p className="text-white/70 mb-6">
            Jeśli konto z podanym adresem email istnieje w naszym systemie, wysłaliśmy instrukcje resetowania hasła.
            Sprawdź swoją skrzynkę pocztową (również folder SPAM).
          </p>
          <p className="text-white/60 text-sm mb-6">
            Link do resetowania hasła jest ważny przez 24 godziny.
          </p>
          <Link href="/admin/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 glass rounded-xl text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 inline mr-2" />
              Powrót do logowania
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
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Reset hasła
            </h1>
            <p className="text-white/70">
              Wprowadź adres email powiązany z Twoim kontem
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-white/70 text-sm mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Adres email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.pl"
                required
                disabled={loading}
                autoComplete="email"
                className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple disabled:opacity-50"
              />
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
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'glass text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-basilica-blue via-basilica-light to-basilica-gold text-white hover:shadow-lg hover:shadow-basilica-light/50'
              }`}
            >
              {loading ? (
                <span className="loading-dots">Wysyłanie</span>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Wyślij link resetujący
                </>
              )}
            </motion.button>

            {/* Links */}
            <div className="text-center space-y-2">
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

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-white/60 text-sm">
              <strong>Wskazówka:</strong> Jeśli nie otrzymasz emaila w ciągu kilku minut,
              sprawdź folder SPAM lub skontaktuj się z administratorem.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
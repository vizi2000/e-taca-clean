'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { Building2, Mail, Lock, CreditCard, FileText, User, Hash, CheckCircle } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api-config'

interface FormData {
  name: string
  nip: string
  krs: string
  bankAccount: string
  email: string
  adminEmail: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

interface FormErrors {
  [key: string]: string
}

export default function RegisterOrganization() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    nip: '',
    krs: '',
    bankAccount: '',
    email: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Organization name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa organizacji jest wymagana'
    }

    // NIP validation (10 digits)
    if (!formData.nip.match(/^\d{10}$/)) {
      newErrors.nip = 'NIP musi składać się z 10 cyfr'
    }

    // KRS validation (optional, but if provided must be valid)
    if (formData.krs && !formData.krs.match(/^\d{1,10}$/)) {
      newErrors.krs = 'KRS może składać się maksymalnie z 10 cyfr'
    }

    // Bank account validation (26 digits)
    if (!formData.bankAccount.match(/^\d{26}$/)) {
      newErrors.bankAccount = 'Numer konta musi składać się z 26 cyfr'
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy adres email organizacji'
    }

    if (!emailRegex.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Nieprawidłowy adres email administratora'
    }

    // Password validation
    if (formData.password.length < 8) {
      newErrors.password = 'Hasło musi mieć minimum 8 znaków'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Hasła nie są identyczne'
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Musisz zaakceptować regulamin'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register-organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          nip: formData.nip,
          krs: formData.krs || null,
          bankAccount: formData.bankAccount,
          email: formData.email,
          password: formData.password,
          adminEmail: formData.adminEmail
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setApiError(data.message || 'Wystąpił błąd podczas rejestracji')
      }
    } catch {
      setApiError('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <GlassCard>
            <div className="text-center">
              <div className="w-20 h-20 glass rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Rejestracja zakończona sukcesem!
              </h2>
              <p className="text-white/70 mb-6">
                Twoja organizacja została zarejestrowana i oczekuje na aktywację przez administratora.
                Po aktywacji otrzymasz powiadomienie email na adres: {formData.adminEmail}
              </p>
              <div className="glass rounded-xl p-4 mb-6">
                <p className="text-white/90 text-sm">
                  <strong>Co dalej?</strong><br />
                  Administrator zweryfikuje dane Twojej organizacji i skonfiguruje bramkę płatności.
                  Proces ten może potrwać do 24 godzin.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gradient-to-r from-basilica-blue to-basilica-light text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-basilica-light/50"
              >
                Powrót do strony głównej
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Rejestracja Organizacji</h1>
          <p className="text-white/60">Dołącz do platformy E-Taca i zacznij zbierać ofiary online</p>
        </div>

        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Dane organizacji
              </h3>
              
              <div>
                <label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  Nazwa organizacji *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="np. Parafia św. Jana"
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4" />
                    NIP *
                  </label>
                  <input
                    type="text"
                    name="nip"
                    value={formData.nip}
                    onChange={handleInputChange}
                    placeholder="10 cyfr"
                    maxLength={10}
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                  {errors.nip && <p className="text-red-400 text-sm mt-1">{errors.nip}</p>}
                </div>

                <div>
                  <label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4" />
                    KRS (opcjonalne)
                  </label>
                  <input
                    type="text"
                    name="krs"
                    value={formData.krs}
                    onChange={handleInputChange}
                    placeholder="Do 10 cyfr"
                    maxLength={10}
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                  {errors.krs && <p className="text-red-400 text-sm mt-1">{errors.krs}</p>}
                </div>
              </div>

              <div>
                <label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4" />
                  Numer konta bankowego *
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  placeholder="26 cyfr"
                  maxLength={26}
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                {errors.bankAccount && <p className="text-red-400 text-sm mt-1">{errors.bankAccount}</p>}
              </div>

              <div>
                <label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email organizacji *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="kontakt@organizacja.pl"
                  autoComplete="email"
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Administrator Account */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Konto administratora
              </h3>

              <div>
                <label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email administratora *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  placeholder="admin@organizacja.pl"
                  autoComplete="email"
                  className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                {errors.adminEmail && <p className="text-red-400 text-sm mt-1">{errors.adminEmail}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4" />
                    Hasło *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min. 8 znaków"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                  {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4" />
                    Potwierdź hasło *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Powtórz hasło"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="glass rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-basilica-blue focus:ring-basilica-light"
                />
                <span className="text-white/70 text-sm">
                  Akceptuję regulamin platformy E-Taca oraz wyrażam zgodę na przetwarzanie
                  danych osobowych w celu świadczenia usług. *
                </span>
              </label>
              {errors.acceptTerms && <p className="text-red-400 text-sm mt-2">{errors.acceptTerms}</p>}
            </div>

            {/* API Error */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 glass border border-red-500/30 rounded-xl"
              >
                <p className="text-red-400 text-sm">{apiError}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                loading
                  ? 'glass text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-basilica-blue to-basilica-light text-white hover:shadow-lg hover:shadow-basilica-light/50'
              }`}
            >
              {loading ? 'Rejestrowanie...' : 'Zarejestruj organizację'}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/40 text-sm text-center">
              Masz już konto?{' '}
              <button
                onClick={() => router.push('/admin/login')}
                className="text-basilica-light hover:text-white transition-colors"
              >
                Zaloguj się
              </button>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
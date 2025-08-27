'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { apiEndpoint } from '@/lib/api/config'
import { 
  Building,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Church
} from 'lucide-react'
import Link from 'next/link'

export default function RegisterOrganization() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    organizationName: '',
    nip: '',
    krs: '',
    bankAccount: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactPerson: '',
    phone: '',
    address: '',
    acceptTerms: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne')
      return
    }
    
    if (!formData.acceptTerms) {
      setError('Musisz zaakceptować regulamin')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(apiEndpoint('/auth/register-organization'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.organizationName,
          nip: formData.nip,
          krs: formData.krs || null,
          bankAccount: formData.bankAccount,
          email: formData.email,
          password: formData.password,
          adminEmail: formData.email
        })
      })
      
      if (response.ok) {
        setSuccess(true)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Błąd podczas rejestracji')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Wystąpił błąd. Spróbuj ponownie.')
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
            Rejestracja zakończona sukcesem!
          </h2>
          <p className="text-white/70 mb-6">
            Twoja organizacja została zarejestrowana. Administrator systemu aktywuje Twoje konto wkrótce.
            Otrzymasz email z potwierdzeniem aktywacji.
          </p>
          <Link href="/admin/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-white"
            >
              Przejdź do logowania
            </motion.button>
          </Link>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 glass rounded-full flex items-center justify-center mx-auto mb-6">
            <Church className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Rejestracja Organizacji
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Zarejestruj swoją parafię lub organizację charytatywną w systemie e-Taca
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Details */}
            <GlassCard hover={false}>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Dane organizacji
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm mb-1 block">
                    Nazwa organizacji *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                    placeholder="np. Parafia św. Jana"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-1 block">
                    NIP *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{10}"
                    value={formData.nip}
                    onChange={(e) => setFormData({...formData, nip: e.target.value})}
                    placeholder="1234567890"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-1 block">
                    KRS (opcjonalne)
                  </label>
                  <input
                    type="text"
                    value={formData.krs}
                    onChange={(e) => setFormData({...formData, krs: e.target.value})}
                    placeholder="0000123456"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-1 block">
                    Numer konta bankowego *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                    placeholder="12 3456 7890 1234 5678 9012 3456"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-1 block">
                    Adres
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="ul. Przykładowa 1, 00-000 Miasto"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                </div>
              </div>
            </GlassCard>

            {/* Contact & Account Details */}
            <GlassCard hover={false}>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Dane kontaktowe i konto
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm mb-1 block">
                    Osoba kontaktowa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    placeholder="Jan Kowalski"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-1 block">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="kontakt@parafia.pl"
                    autoComplete="email"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-1 block">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+48 123 456 789"
                    autoComplete="tel"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-1 block">
                    Hasło *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimum 8 znaków"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-1 block">
                    Potwierdź hasło *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Powtórz hasło"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 glass rounded-xl bg-transparent text-white placeholder-white/40"
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Terms and Submit */}
          <div className="mt-8">
            <GlassCard hover={false}>
              <div className="space-y-6">
                {/* Terms acceptance */}
                <label className="flex items-start gap-3 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({...formData, acceptTerms: e.target.checked})}
                    className="mt-1 w-4 h-4"
                  />
                  <span className="text-sm">
                    Akceptuję <Link href="/terms" className="text-accent-blue hover:underline">regulamin</Link> oraz{' '}
                    <Link href="/privacy" className="text-accent-blue hover:underline">politykę prywatności</Link>.
                    Wyrażam zgodę na przetwarzanie danych osobowych w celu świadczenia usług.
                  </span>
                </label>

                {/* Error message */}
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
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
                    <span className="loading-dots">Rejestrowanie</span>
                  ) : (
                    <>
                      Zarejestruj organizację
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                {/* Login link */}
                <p className="text-center text-white/60">
                  Masz już konto?{' '}
                  <Link href="/admin/login" className="text-accent-blue hover:underline">
                    Zaloguj się
                  </Link>
                </p>
              </div>
            </GlassCard>
          </div>
        </form>
      </div>
    </div>
  )
}
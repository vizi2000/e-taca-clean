'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/glass-card'

export default function DonationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard className="max-w-md text-center">
          <div className="w-20 h-20 glass rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Dziękujemy za Twoją ofiarę!
          </h1>
          
          <p className="text-white/70 mb-8">
            Twoja darowizna została pomyślnie zarejestrowana. 
            Otrzymasz potwierdzenie na podany adres email.
          </p>
          
          <Link href="/bazylika-mikolow">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 glass-heavy rounded-xl text-white font-semibold hover:bg-white/30 transition-colors"
            >
              Powrót do strony głównej
            </motion.button>
          </Link>
        </GlassCard>
      </motion.div>
    </div>
  )
}
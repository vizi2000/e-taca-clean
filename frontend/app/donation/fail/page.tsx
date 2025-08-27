'use client'

import { motion } from 'framer-motion'
import { XCircle } from 'lucide-react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/glass-card'

export default function DonationFailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard className="max-w-md text-center">
          <div className="w-20 h-20 glass rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Płatność nieudana
          </h1>
          
          <p className="text-white/70 mb-8">
            Wystąpił problem z przetworzeniem Twojej płatności. 
            Nie pobrano żadnych środków z Twojego konta.
          </p>
          
          <Link href="/bazylika-mikolow">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 glass-heavy rounded-xl text-white font-semibold hover:bg-white/30 transition-colors mb-4"
            >
              Spróbuj ponownie
            </motion.button>
          </Link>
          
          <Link href="/bazylika-mikolow">
            <button className="text-white/60 hover:text-white transition-colors">
              Powrót do strony głównej
            </button>
          </Link>
        </GlassCard>
      </motion.div>
    </div>
  )
}
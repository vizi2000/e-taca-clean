'use client'

import { motion } from 'framer-motion'
import { Church } from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Immediate redirect to Admin Login
    router.push('/admin/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="w-24 h-24 glass rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
          <Church className="w-12 h-12 text-basilica-light" />
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-4">e-Taca</h1>
        <p className="text-2xl text-basilica-gold mb-2">System Zarządzania</p>
        <p className="text-white/60 loading-dots">Przekierowanie do logowania</p>
      </motion.div>
    </div>
  )
}
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  delay?: number
  glow?: boolean
}

export function GlassCard({ 
  children, 
  className, 
  hover = true, 
  delay = 0,
  glow = false 
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.23, 1, 0.32, 1]
      }}
      whileHover={hover ? { 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : undefined}
      className={cn(
        'glass rounded-2xl p-6',
        'shadow-xl',
        hover && 'hover-lift cursor-pointer',
        glow && 'glow',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
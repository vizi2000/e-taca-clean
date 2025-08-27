'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max: number
  className?: string
  showLabel?: boolean
  animated?: boolean
}

export function ProgressBar({ 
  value, 
  max, 
  className,
  showLabel = false,
  animated = true
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div className={cn('relative', className)}>
      <div className="h-3 glass rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent-blue via-accent-purple to-accent-gold rounded-full"
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 1.5, 
            ease: [0.23, 1, 0.32, 1],
            delay: 0.2
          }}
        >
          <div className="h-full shimmer" />
        </motion.div>
      </div>
      {showLabel && (
        <div className="absolute -top-8 left-0 text-sm text-white/80">
          {percentage.toFixed(0)}%
        </div>
      )}
    </div>
  )
}
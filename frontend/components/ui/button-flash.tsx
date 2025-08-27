'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ButtonFlashProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function ButtonFlash({ children, onClick, className = '', disabled = false }: ButtonFlashProps) {
  const [flashes, setFlashes] = useState<{ id: number; x: number; y: number }[]>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    // Get button position and click coordinates
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Add new flash
    const flashId = Date.now()
    setFlashes(prev => [...prev, { id: flashId, x, y }])

    // Remove flash after animation
    setTimeout(() => {
      setFlashes(prev => prev.filter(f => f.id !== flashId))
    }, 1000)

    // Call original onClick
    onClick?.()
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
    >
      {children}

      {/* Flash effects */}
      <AnimatePresence>
        {flashes.map(flash => (
          <motion.div
            key={flash.id}
            className="absolute pointer-events-none"
            style={{
              left: flash.x,
              top: flash.y,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Central burst */}
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(201,169,97,0.6) 30%, transparent 70%)',
                filter: 'blur(2px)',
              }}
            />
            
            {/* Light rays */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: '2px',
                  height: '60px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                  transform: `rotate(${i * 45}deg)`,
                  transformOrigin: 'center',
                }}
                animate={{
                  height: ['60px', '150px', '100px'],
                  opacity: [0.8, 0.4, 0],
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Holy glow overlay that appears on click */}
      <AnimatePresence>
        {flashes.length > 0 && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'radial-gradient(circle, rgba(201,169,97,0.3) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />
        )}
      </AnimatePresence>
    </button>
  )
}
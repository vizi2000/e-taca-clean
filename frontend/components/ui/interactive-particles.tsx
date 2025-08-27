'use client'

import { motion, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

export function InteractiveParticles() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [mouseVelocity, setMouseVelocity] = useState(0)
  const [scrollVelocity, setScrollVelocity] = useState(0)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const lastScrollPos = useRef(0)
  const velocityTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
  
  const springConfig = { damping: 50, stiffness: 100 }
  const velocitySpring = useSpring(0, springConfig)

  useEffect(() => {
    // Generate initial particles
    const initialParticles: Particle[] = []
    for (let i = 0; i < 30; i++) {
      initialParticles.push({
        id: i,
        x: Math.random() * 100,
        y: 110 + Math.random() * 20, // Start below viewport
        size: Math.random() * 3 + 1,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 5,
      })
    }
    setParticles(initialParticles)

    // Mouse velocity tracking
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - lastMousePos.current.x
      const deltaY = e.clientY - lastMousePos.current.y
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      setMouseVelocity(velocity)
      velocitySpring.set(velocity)
      
      lastMousePos.current = { x: e.clientX, y: e.clientY }

      // Reset velocity after mouse stops
      clearTimeout(velocityTimeout.current)
      velocityTimeout.current = setTimeout(() => {
        setMouseVelocity(0)
        velocitySpring.set(0)
      }, 100)
    }

    // Scroll velocity tracking
    const handleScroll = () => {
      const currentScroll = window.scrollY
      const deltaScroll = Math.abs(currentScroll - lastScrollPos.current)
      
      setScrollVelocity(deltaScroll)
      lastScrollPos.current = currentScroll

      // Reset scroll velocity
      clearTimeout(velocityTimeout.current)
      velocityTimeout.current = setTimeout(() => {
        setScrollVelocity(0)
      }, 100)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(velocityTimeout.current)
    }
  }, [velocitySpring])

  // Calculate speed multiplier based on interaction
  const speedMultiplier = 1 + (mouseVelocity / 100) + (scrollVelocity / 50)
  const clampedMultiplier = Math.min(Math.max(speedMultiplier, 0.5), 5)

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(201,169,97,0.4) 50%, transparent 70%)`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(201,169,97,0.3)`,
          }}
          initial={{ 
            y: `${particle.y}vh`,
            opacity: 0 
          }}
          animate={{ 
            y: '-10vh',
            opacity: [0, 0.6, 0.8, 0.6, 0],
          }}
          transition={{
            y: {
              duration: particle.duration / clampedMultiplier,
              repeat: Infinity,
              ease: "linear",
              delay: particle.delay,
            },
            opacity: {
              duration: particle.duration / clampedMultiplier,
              repeat: Infinity,
              ease: "easeInOut",
              delay: particle.delay,
            }
          }}
        />
      ))}

      {/* Extra particles that appear on high velocity */}
      {(mouseVelocity > 50 || scrollVelocity > 30) && (
        <>
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`fast-${i}`}
              className="absolute rounded-full"
              style={{
                width: '2px',
                height: '2px',
                left: `${Math.random() * 100}%`,
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 0 6px rgba(255,255,255,0.6)',
              }}
              initial={{ 
                y: '110vh',
                opacity: 0 
              }}
              animate={{ 
                y: '-10vh',
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 / clampedMultiplier,
                ease: "linear",
                delay: i * 0.1,
              }}
            />
          ))}
        </>
      )}

      {/* Velocity indicator (subtle glow effect) */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-32"
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(201,169,97,${mouseVelocity * 0.001 + scrollVelocity * 0.002}) 100%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: mouseVelocity > 20 || scrollVelocity > 10 ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}
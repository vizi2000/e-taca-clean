'use client'

import { motion } from 'framer-motion'

export function DivineBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Divine Rays from Above */}
      <div className="absolute inset-0">
        {/* Central bright ray */}
        <motion.div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[300px] h-[150%]"
          style={{
            background: `linear-gradient(180deg, 
              rgba(255,255,255,0.15) 0%, 
              rgba(201,169,97,0.08) 20%, 
              transparent 60%)`,
            clipPath: 'polygon(45% 0%, 50% 100%, 50% 100%, 55% 0%)',
            filter: 'blur(2px)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scaleX: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Multiple divine rays */}
        {[...Array(7)].map((_, i) => {
          const offset = (i - 3) * 15; // Spread rays across screen
          const delay = i * 0.5;
          
          return (
            <motion.div
              key={`ray-${i}`}
              className="absolute top-0 left-1/2 transform -translate-x-1/2 h-[120%]"
              style={{
                width: '200px',
                background: `linear-gradient(180deg, 
                  rgba(201,169,97,${0.15 - i * 0.02}) 0%, 
                  rgba(255,255,255,${0.05 - i * 0.005}) 10%,
                  transparent 50%)`,
                clipPath: `polygon(${48 + i * 0.5}% 0%, ${49 + i * 0.2}% 100%, ${51 - i * 0.2}% 100%, ${52 - i * 0.5}% 0%)`,
                filter: 'blur(3px)',
                transform: `translateX(${offset}%)`,
              }}
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scaleY: [1, 1.1, 1],
              }}
              transition={{
                duration: 10 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              }}
            />
          )
        })}

        {/* Heavenly glow at top */}
        <motion.div
          className="absolute -top-1/4 left-1/2 transform -translate-x-1/2 w-[150%] h-[50%]"
          style={{
            background: `radial-gradient(ellipse at center, 
              rgba(255,255,255,0.2) 0%, 
              rgba(201,169,97,0.1) 20%, 
              transparent 60%)`,
            filter: 'blur(60px)',
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Cloud Layers */}
      <div className="absolute inset-0">
        {/* First cloud layer - furthest back */}
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='cloud'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='2' result='turbulence'/%3E%3CfeColorMatrix in='turbulence' type='saturate' values='0'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='200%25' height='200%25' filter='url(%23cloud)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '100% 100%',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Second cloud layer */}
        <motion.div
          className="absolute inset-0 opacity-8"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='cloud2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.008' numOctaves='3' result='turbulence'/%3E%3CfeColorMatrix in='turbulence' type='saturate' values='0'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='300%25' height='300%25' filter='url(%23cloud2)' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '150% 150%',
            transform: 'scale(1.5)',
          }}
          animate={{
            x: [-100, 50, -100],
            y: [50, -30, 50],
          }}
          transition={{
            duration: 90,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Third cloud layer - closest */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='cloud3'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005' numOctaves='4' result='turbulence'/%3E%3CfeColorMatrix in='turbulence' type='saturate' values='0'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='400%25' height='400%25' filter='url(%23cloud3)' opacity='0.2'/%3E%3C/svg%3E")`,
            backgroundSize: '200% 200%',
            transform: 'scale(2)',
          }}
          animate={{
            x: [100, -200, 100],
            y: [-100, 100, -100],
          }}
          transition={{
            duration: 120,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Soft ambient glow patches */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`glow-${i}`}
          className="absolute rounded-full"
          style={{
            width: '600px',
            height: '600px',
            background: `radial-gradient(circle, rgba(201,169,97,0.05) 0%, transparent 70%)`,
            filter: 'blur(100px)',
            left: `${20 + i * 30}%`,
            top: `${10 + i * 20}%`,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}
    </div>
  )
}
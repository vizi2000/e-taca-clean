'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const quotes = [
  { text: "Błogosławieni miłosierni", author: "Mt 5,7" },
  { text: "Wiara czyni cuda", author: "Mt 17,20" },
  { text: "Bóg jest miłością", author: "1 J 4,8" },
  { text: "Pokój zostawiam wam", author: "J 14,27" },
  { text: "Światłość świata", author: "J 8,12" },
  { text: "Droga, Prawda i Życie", author: "J 14,6" },
  { text: "Ufaj Panu z całego serca", author: "Prz 3,5" },
  { text: "Pan jest moim pasterzem", author: "Ps 23,1" },
  { text: "Miłość cierpliwa jest", author: "1 Kor 13,4" },
  { text: "Wszystko mogę w Tym, który mnie umacnia", author: "Flp 4,13" },
]

export function SpiritualQuotes() {
  const [currentQuote, setCurrentQuote] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating quotes in different positions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 0.3, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 1.1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 text-white/40 text-2xl font-light italic"
        >
          <p className="drop-shadow-lg">{quotes[currentQuote].text}</p>
          <p className="text-sm mt-2 text-basilica-gold/60">{quotes[currentQuote].author}</p>
        </motion.div>
      </AnimatePresence>

      {/* Additional floating quote in different position */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote + 5}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 0.25, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 3, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/3 right-1/4 text-white/30 text-xl font-light italic text-right"
        >
          <p className="drop-shadow-lg">{quotes[(currentQuote + 5) % quotes.length].text}</p>
          <p className="text-sm mt-2 text-basilica-gold/50">{quotes[(currentQuote + 5) % quotes.length].author}</p>
        </motion.div>
      </AnimatePresence>

      {/* Glowing orbs floating around */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-32 h-32 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(201,169,97,0.2) 0%, transparent 70%)`,
            filter: 'blur(40px)',
            left: `${20 + i * 15}%`,
            top: `${30 + i * 10}%`,
          }}
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -40, 40, 0],
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.3, 0.5, 0.3, 0.3],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Divine light rays */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 left-1/2 transform -translate-x-1/2 w-[200%] h-full"
          style={{
            background: `linear-gradient(180deg, rgba(201,169,97,0.1) 0%, transparent 50%)`,
            clipPath: 'polygon(45% 0%, 48% 100%, 52% 100%, 55% 0%)',
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -top-1/2 left-1/3 transform -translate-x-1/2 w-[200%] h-full"
          style={{
            background: `linear-gradient(180deg, rgba(74,124,194,0.1) 0%, transparent 60%)`,
            clipPath: 'polygon(48% 0%, 49% 100%, 51% 100%, 52% 0%)',
          }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, -3, 3, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>
    </div>
  )
}
"use client"

import { useEffect, useState } from 'react'

export function FloatingAmbientGlows() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Glow 1 - Changes color based on theme */}
      <div 
        className="absolute rounded-full transition-all duration-[2000ms] ease-in-out"
        style={{
          top: '-10%',
          right: '20%',
          width: 'min(1800px, 120vw)',
          height: 'min(1800px, 120vh)',
          filter: 'blur(min(100px, 8vw))',
          animation: 'floatGlow1 90s ease-in-out infinite',
        }}
      >
        {/* Light mode color */}
        <div 
          className="absolute inset-0 rounded-full dark:opacity-0 transition-opacity duration-[2000ms]"
          style={{
            background: 'radial-gradient(circle, rgba(63, 193, 201, 0.25) 0%, rgba(63, 193, 201, 0.10) 30%, rgba(63, 193, 201, 0.03) 60%, transparent 80%)',
          }}
        />
        {/* Dark mode color */}
        <div 
          className="absolute inset-0 rounded-full opacity-0 dark:opacity-100 transition-opacity duration-[2000ms]"
          style={{
            background: 'radial-gradient(circle, rgba(244, 96, 54, 0.22) 0%, rgba(244, 96, 54, 0.10) 30%, rgba(244, 96, 54, 0.03) 60%, transparent 80%)',
            mixBlendMode: 'screen',
          }}
        />
      </div>
      
      {/* Glow 2 - Changes color based on theme */}
      <div 
        className="absolute rounded-full transition-all duration-[2000ms] ease-in-out"
        style={{
          bottom: '-10%',
          left: '20%',
          width: 'min(1600px, 110vw)',
          height: 'min(1600px, 110vh)',
          filter: 'blur(min(100px, 8vw))',
          animation: 'floatGlow2 100s ease-in-out infinite',
        }}
      >
        {/* Light mode color */}
        <div 
          className="absolute inset-0 rounded-full dark:opacity-0 transition-opacity duration-[2000ms]"
          style={{
            background: 'radial-gradient(circle, rgba(0, 188, 212, 0.22) 0%, rgba(0, 188, 212, 0.08) 30%, rgba(0, 188, 212, 0.02) 60%, transparent 80%)',
          }}
        />
        {/* Dark mode color */}
        <div 
          className="absolute inset-0 rounded-full opacity-0 dark:opacity-100 transition-opacity duration-[2000ms]"
          style={{
            background: 'radial-gradient(circle, rgba(215, 78, 37, 0.18) 0%, rgba(215, 78, 37, 0.08) 30%, rgba(215, 78, 37, 0.02) 60%, transparent 80%)',
            mixBlendMode: 'screen',
          }}
        />
      </div>
      
      {/* Glow 3 - Changes color based on theme */}
      <div 
        className="absolute rounded-full transition-all duration-[2000ms] ease-in-out"
        style={{
          top: '40%',
          left: '45%',
          width: 'min(1500px, 100vw)',
          height: 'min(1500px, 100vh)',
          filter: 'blur(min(100px, 8vw))',
          animation: 'floatGlow3 95s ease-in-out infinite',
        }}
      >
        {/* Light mode color */}
        <div 
          className="absolute inset-0 rounded-full dark:opacity-0 transition-opacity duration-[2000ms]"
          style={{
            background: 'radial-gradient(circle, rgba(77, 208, 225, 0.20) 0%, rgba(77, 208, 225, 0.06) 30%, rgba(77, 208, 225, 0.02) 60%, transparent 80%)',
          }}
        />
        {/* Dark mode color */}
        <div 
          className="absolute inset-0 rounded-full opacity-0 dark:opacity-100 transition-opacity duration-[2000ms]"
          style={{
            background: 'radial-gradient(circle, rgba(255, 107, 53, 0.16) 0%, rgba(255, 107, 53, 0.06) 30%, rgba(255, 107, 53, 0.02) 60%, transparent 80%)',
            mixBlendMode: 'screen',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes floatGlow1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(-40vw, -30vh) scale(1.2);
          }
          50% {
            transform: translate(35vw, -20vh) scale(0.8);
          }
          75% {
            transform: translate(-25vw, 40vh) scale(1.1);
          }
        }

        @keyframes floatGlow2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          20% {
            transform: translate(45vw, 25vh) scale(1.3) rotate(25deg);
          }
          40% {
            transform: translate(-35vw, -15vh) scale(0.75) rotate(-15deg);
          }
          60% {
            transform: translate(30vw, -35vh) scale(1.15) rotate(30deg);
          }
          80% {
            transform: translate(-40vw, 20vh) scale(0.9) rotate(-10deg);
          }
        }

        @keyframes floatGlow3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          30% {
            transform: translate(-50vw, 35vh) scale(1.4);
          }
          55% {
            transform: translate(40vw, -40vh) scale(0.7);
          }
          85% {
            transform: translate(-20vw, -25vh) scale(1.2);
          }
        }
        
        @keyframes glowPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.75;
          }
        }
      `}</style>
    </div>
  )
}


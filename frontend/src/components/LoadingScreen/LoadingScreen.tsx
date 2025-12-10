import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import './LoadingScreen.scss'

interface LoadingScreenProps {
  progress: number
  onComplete?: () => void
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, onComplete }) => {
  const curtainRef = useRef<HTMLDivElement>(null)
  const [isExiting, setIsExiting] = useState(false)
  const displayProgress = Math.min(100, Math.round(progress))

  useEffect(() => {
    if (displayProgress >= 100 && curtainRef.current && !isExiting) {
      setIsExiting(true)
      
      // Elegant curtain reveal animation
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete?.()
        }
      })

      tl.to('.loading-content', {
        opacity: 0,
        scale: 0.95,
        duration: 0.4,
        ease: 'power2.inOut'
      })
      .to(curtainRef.current, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 1,
        ease: 'expo.inOut'
      }, '-=0.1')
    }
  }, [displayProgress, isExiting, onComplete])

  return (
    <div ref={curtainRef} className="loading-curtain">
      <div className="loading-content">
        {/* Favicon/Logo Animation */}
        <motion.div 
          className="loading-logo"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <svg 
            className="logo-icon" 
            width="80" 
            height="80" 
            viewBox="0 0 64 64" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Animated Sunglasses Icon */}
            <motion.ellipse 
              cx="20" cy="32" rx="11" ry="8" 
              fill="none" 
              stroke="#D4AF37" 
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
            <motion.ellipse 
              cx="44" cy="32" rx="11" ry="8" 
              fill="none" 
              stroke="#D4AF37" 
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
            />
            
            {/* Bridge */}
            <motion.path 
              d="M31 32 Q32 28 33 32" 
              stroke="#D4AF37" 
              strokeWidth="1.5" 
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            />
            
            {/* Temples */}
            <motion.line 
              x1="9" y1="32" x2="4" y2="30" 
              stroke="#D4AF37" 
              strokeWidth="1.5" 
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 1 }}
            />
            <motion.line 
              x1="55" y1="32" x2="60" y2="30" 
              stroke="#D4AF37" 
              strokeWidth="1.5" 
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 1 }}
            />
            
            {/* Center dots */}
            <motion.circle 
              cx="20" cy="32" r="1.5" 
              fill="#D4AF37"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 1.2 }}
            />
            <motion.circle 
              cx="44" cy="32" r="1.5" 
              fill="#D4AF37"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 1.2 }}
            />
          </svg>
          
          {/* Pulsing glow effect */}
          <div className="logo-glow" />
        </motion.div>

        {/* Brand Name */}
        <motion.div 
          className="loading-brand"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="brand-text">NEXUS</span>
          <span className="brand-accent">OPTICS</span>
        </motion.div>

        {/* Progress Section */}
        <div className="loading-progress">
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: displayProgress / 100 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          <div className="progress-info">
            <span className="progress-label">Loading Experience</span>
            <span className="progress-number">{displayProgress}%</span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="loading-decoration">
        <div className="deco-line deco-line-1" />
        <div className="deco-line deco-line-2" />
      </div>
    </div>
  )
}

export default LoadingScreen

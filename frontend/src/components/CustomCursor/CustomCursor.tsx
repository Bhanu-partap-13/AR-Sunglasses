import { useEffect, useRef } from 'react'
import './CustomCursor.scss'

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Skip on touch devices
    if ('ontouchstart' in window) return

    const cursor = cursorRef.current
    if (!cursor) return

    let mouseX = 0
    let mouseY = 0
    let cursorX = 0
    let cursorY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    // Use requestAnimationFrame for smooth cursor movement
    const animate = () => {
      // Lerp for smooth following
      cursorX += (mouseX - cursorX) * 0.15
      cursorY += (mouseY - cursorY) * 0.15
      
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`
      requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Hide on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null
  }

  return (
    <div ref={cursorRef} className="custom-cursor-blend" />
  )
}

export default CustomCursor

// ============================================
// PARTICLE EFFECTS UTILITY
// ============================================

export const createParticleField = (containerId: string, particleCount: number = 50) => {
  const container = document.getElementById(containerId)
  if (!container) return

  // Clear existing particles
  container.innerHTML = ''

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle-dot'
    
    // Random positioning
    particle.style.left = `${Math.random() * 100}%`
    particle.style.top = `${Math.random() * 100}%`
    
    // Random animation duration
    const duration = 15 + Math.random() * 20
    particle.style.animationDuration = `${duration}s`
    
    // Random delay
    const delay = Math.random() * 5
    particle.style.animationDelay = `${delay}s`
    
    // Random size
    const size = 2 + Math.random() * 3
    particle.style.width = `${size}px`
    particle.style.height = `${size}px`
    
    // Random opacity
    particle.style.opacity = `${0.2 + Math.random() * 0.4}`
    
    container.appendChild(particle)
  }
}

export const createGlowEffect = (element: HTMLElement) => {
  const glow = document.createElement('div')
  glow.className = 'glow-effect'
  element.style.position = 'relative'
  element.appendChild(glow)
}

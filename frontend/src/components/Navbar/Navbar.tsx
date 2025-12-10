import { useState, useEffect, useCallback, memo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import './Navbar.scss'

const navLinks = [
  { href: '/', label: 'Home', isRoute: true },
  { href: '#features', label: 'Features', isRoute: false },
  { href: '/collection', label: 'Collections', isRoute: true },
  { href: '/customize', label: 'Customize', isRoute: true },
  { href: '/dashboard', label: 'Dashboard', isRoute: true },
]

const Navbar: React.FC = memo(() => {
  const [isScrolled, setIsScrolled] = useState(false)
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = useCallback((href: string, isRoute: boolean) => {
    closeMobileMenu()
    
    if (isRoute) {
      // Navigate to a different page
      navigate(href)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // If we're not on home page, go to home first then scroll
      if (location.pathname !== '/') {
        navigate('/')
        // Wait for navigation then scroll
        setTimeout(() => {
          const targetId = href.replace('#', '')
          const element = document.getElementById(targetId)
          if (element) {
            const offset = 80
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - offset
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
          }
        }, 100)
      } else {
        // Scroll to section on same page
        const targetId = href.replace('#', '')
        const element = document.getElementById(targetId)
        if (element) {
          const offset = 80
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - offset
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
        }
      }
    }
  }, [closeMobileMenu, navigate, location.pathname])

  return (
    <>
      <motion.nav
        className={`navbar ${isScrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'menu-open' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="nav-container">
          {/* Logo - Left Side */}
          <a href="/" className="nav-logo" onClick={(e) => { e.preventDefault(); handleNavClick('/', true) }}>
            <span className="logo-text">NEXUS</span>
            <span className="logo-accent">OPTICS</span>
          </a>

          {/* Menu Button - Right Side */}
          <button 
            className={`menu-button ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className="menu-button-text">{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
            <span className="menu-button-icon">
              <span className="icon-line icon-line-1" />
              <span className="icon-line icon-line-2" />
            </span>
          </button>
        </div>
      </motion.nav>

      {/* Full Screen Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={closeMobileMenu}
            />
            
            {/* Menu Panel */}
            <motion.div
              className="menu-overlay"
              initial={{ clipPath: 'circle(0% at calc(100% - 60px) 40px)' }}
              animate={{ clipPath: 'circle(150% at calc(100% - 60px) 40px)' }}
              exit={{ clipPath: 'circle(0% at calc(100% - 60px) 40px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="menu-content">
                {/* Left Section - Brand Logo */}
                <motion.div 
                  className="menu-brand"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <span className="brand-name">NEXUS</span>
                </motion.div>

                {/* Center Section - Navigation Links */}
                <nav className="menu-nav">
                  <ul className="menu-links">
                    {navLinks.map((link, index) => (
                      <motion.li
                        key={link.href}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ 
                          delay: 0.1 + index * 0.05,
                          duration: 0.5,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                      >
                        <a 
                          href={link.href} 
                          className="menu-link"
                          onClick={(e) => { e.preventDefault(); handleNavClick(link.href, link.isRoute) }}
                        >
                          <span className="link-text">{link.label}</span>
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </nav>

                {/* Right Section - Contact Info & Social */}
                <motion.div 
                  className="menu-info"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className="info-column">
                    <p className="info-heading">NEXUS HQ</p>
                    <p className="info-text">LOVELY PROFESSIONAL UNIVERSITY</p>
                    <p className="info-text">PHAGWARA, 144411</p>
                    <p className="info-text">PUNJAB, INDIA</p>
                    <p className="info-email">PARTAPBHANU516@GMAIL.COM</p>
                  </div>
                  <div className="info-column social-column">
                    <a href="https://instagram.com/partap_bhanu__" target="_blank" rel="noopener noreferrer" className="social-link">INSTAGRAM</a>
                    <a href="https://www.linkedin.com/in/bhanu-partap-a49084274/" target="_blank" rel="noopener noreferrer" className="social-link">LINKEDIN</a>
                    <a href="https://www.youtube.com/@Brainicbhanu/shorts" target="_blank" rel="noopener noreferrer" className="social-link">YOUTUBE</a>
                  </div>
                </motion.div>

                {/* Bottom Section - Video Card & Brand Text */}
                <div className="menu-bottom">
                  <motion.div 
                    className="menu-video-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <span className="video-time">1.00</span>
                  </motion.div>
                  <motion.div 
                    className="menu-brand-large"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <span className="brand-text">NEXUS</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
})

Navbar.displayName = 'Navbar'

export default Navbar

import { useState, useEffect, Suspense, lazy, useCallback, Component, ReactNode } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger)

// Components (loaded immediately)
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import CustomCursor from './components/CustomCursor/CustomCursor'

// ─── Animated fallback shown when a page fails to load ──────────────────────
const AnimatedFallback = () => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    background: '#050508',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '2rem', fontFamily: 'inherit',
  }}>
    {/* Ambient glow ring */}
    <div style={{
      position: 'absolute',
      width: 320, height: 320,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
      animation: 'fb-pulse 2.8s ease-in-out infinite',
    }} />

    {/* Sunglasses SVG */}
    <div style={{ position: 'relative', animation: 'fb-float 3s ease-in-out infinite' }}>
      <svg width="110" height="46" viewBox="0 0 110 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left lens */}
        <rect x="4" y="10" width="40" height="26" rx="13" fill="rgba(212,175,55,0.08)" stroke="#D4AF37" strokeWidth="2"/>
        {/* Right lens */}
        <rect x="66" y="10" width="40" height="26" rx="13" fill="rgba(212,175,55,0.08)" stroke="#D4AF37" strokeWidth="2"/>
        {/* Bridge */}
        <path d="M44 23 Q55 17 66 23" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* Left arm */}
        <path d="M4 23 L0 25" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
        {/* Right arm */}
        <path d="M106 23 L110 25" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
        {/* Lens shine left */}
        <path d="M14 16 Q18 14 22 16" stroke="rgba(212,175,55,0.45)" strokeWidth="1.2" strokeLinecap="round"/>
        {/* Lens shine right */}
        <path d="M76 16 Q80 14 84 16" stroke="rgba(212,175,55,0.45)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>

      {/* Sparkles */}
      {[[-18,-14,'fb-sp1'],[ 22,-22,'fb-sp2'],[  40,-8,'fb-sp3'],[-30, 8,'fb-sp4']].map(([x,y,cls]) => (
        <div key={cls as string} style={{
          position:'absolute', top:'50%', left:'50%',
          transform:`translate(${x}px,${y}px)`,
          width:4, height:4, borderRadius:'50%',
          background:'#D4AF37',
          animation:`${cls} 2.4s ease-in-out infinite`,
        }}/>
      ))}
    </div>

    {/* Heading */}
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '1.05rem',
        fontWeight: 600,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.75)',
        marginBottom: '0.55rem',
      }}>Something went wrong</div>
      <button
        onClick={() => window.location.reload()}
        style={{
          fontSize: '0.72rem',
          letterSpacing: '0.12em',
          color: 'rgba(212,175,55,0.65)',
          background: 'none', border: 'none',
          cursor: 'pointer', textDecoration: 'underline',
          textUnderlineOffset: 3,
          textTransform: 'uppercase',
          padding: 0,
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color='#D4AF37')}
        onMouseLeave={e => (e.currentTarget.style.color='rgba(212,175,55,0.65)')}
      >refresh the page</button>
    </div>

    {/* Thin gold progress bar at bottom */}
    <div style={{
      position:'absolute', bottom:0, left:0,
      width:'100%', height:2,
      background:'linear-gradient(90deg,transparent,#D4AF37,transparent)',
      animation:'fb-bar 2s ease-in-out infinite',
    }}/>

    <style>{`
      @keyframes fb-pulse  { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.18);opacity:1} }
      @keyframes fb-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
      @keyframes fb-bar    { 0%{opacity:.3} 50%{opacity:1} 100%{opacity:.3} }
      @keyframes fb-sp1    { 0%,100%{opacity:0;transform:translate(-18px,-14px) scale(.6)} 40%{opacity:1;transform:translate(-22px,-20px) scale(1)} }
      @keyframes fb-sp2    { 0%,100%{opacity:0;transform:translate(22px,-22px) scale(.6)} 55%{opacity:1;transform:translate(26px,-28px) scale(1)} }
      @keyframes fb-sp3    { 0%,100%{opacity:0;transform:translate(40px,-8px) scale(.6)}  30%{opacity:1;transform:translate(46px,-12px) scale(1)} }
      @keyframes fb-sp4    { 0%,100%{opacity:0;transform:translate(-30px,8px) scale(.6)}  45%{opacity:1;transform:translate(-36px,12px) scale(1)} }
    `}</style>
  </div>
)

// Error Boundary for catching lazy loading and render errors
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <AnimatedFallback />
    }
    return this.props.children
  }
}

// Lazy loaded pages with retry logic
const lazyWithRetry = (importFn: () => Promise<any>, retries = 3) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attempt = (retriesLeft: number) => {
        importFn()
          .then(resolve)
          .catch((error: Error) => {
            if (retriesLeft > 0) {
              setTimeout(() => attempt(retriesLeft - 1), 1000)
            } else {
              reject(error)
            }
          })
      }
      attempt(retries)
    })
  })
}

const HomePage = lazyWithRetry(() => import('./pages/HomePage'))
const CollectionPage = lazyWithRetry(() => import('./pages/CollectionPage'))
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'))
const ProductPage = lazyWithRetry(() => import('./pages/ProductPage'))
const CustomizePage = lazyWithRetry(() => import('./pages/CustomizePage'))
const ARTryOnPage = lazyWithRetry(() => import('./pages/ARTryOnPage'))

// Styles
import './App.scss'

// Scroll to top on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    // Instant scroll — works with both Lenis and native scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])
  return null
}

// Footer that hides itself briefly when the route changes, so the user
// sees the incoming page's loader rather than a stale footer.
const NavigationAwareFooter = () => {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Hide immediately on route change, reveal after a short delay
    // so the page's own Suspense fallback has time to render first.
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <div
      style={{
        opacity:       visible ? 1 : 0,
        visibility:    visible ? 'visible' : 'hidden',
        transition:    'opacity 0.35s ease',
        pointerEvents: visible ? undefined : 'none',
      }}
    >
      <Footer />
    </div>
  )
}

// Section loading placeholder
const SectionLoader = () => (
  <div style={{
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', gap: '1.2rem',
    background: '#050508',
  }}>
    {/* Spinning gold ring */}
    <div style={{
      width: 48, height: 48, borderRadius: '50%',
      border: '2px solid rgba(212,175,55,0.15)',
      borderTopColor: '#D4AF37',
      animation: 'spin 0.85s linear infinite',
    }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [, setIsLoadingComplete] = useState(false)

  // Track actual loading progress
  useEffect(() => {
    const loadingState = {
      dom: false,
      fonts: false,
      ready: false,
    }

    const updateProgress = () => {
      const completed = Object.values(loadingState).filter(Boolean).length
      const total = Object.keys(loadingState).length
      const progress = Math.min(100, Math.round((completed / total) * 100))
      setLoadingProgress(progress)
      
      if (progress >= 100) {
        setIsLoadingComplete(true)
      }
    }

    // Step 1: DOM ready
    if (document.readyState === 'complete') {
      loadingState.dom = true
      updateProgress()
    } else {
      window.addEventListener('load', () => {
        loadingState.dom = true
        updateProgress()
      }, { once: true })
    }

    // Step 2: Fonts loaded
    document.fonts.ready.then(() => {
      loadingState.fonts = true
      updateProgress()
    }).catch(() => {
      loadingState.fonts = true
      updateProgress()
    })

    // Step 3: Final ready check - ensure minimum loading time for smooth animation
    const readyTimer = setTimeout(() => {
      loadingState.ready = true
      updateProgress()
    }, 1200)

    return () => {
      clearTimeout(readyTimer)
    }
  }, [])

  // Handle loading complete callback
  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false)
  }, [])

  // Initialize Lenis smooth scrolling with GSAP integration
  useEffect(() => {
    if (isLoading) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    })

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(lenis.raf)
    }
  }, [isLoading])

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen 
            key="loading" 
            progress={loadingProgress} 
            onComplete={handleLoadingComplete}
          />
        )}
      </AnimatePresence>
      
      {/* Always render content but hide until loading complete */}
      <div className={`app-content ${isLoading ? 'hidden' : 'visible'}`}>
        <ScrollToTop />
        <Navbar />
        <CustomCursor />
        <ErrorBoundary>
          <Suspense fallback={<SectionLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/product/:productId" element={<ProductPage />} />
              <Route path="/customize" element={<CustomizePage />} />
              <Route path="/ar/:productId" element={<ARTryOnPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <NavigationAwareFooter />
      </div>
    </div>
  )
}

export default App

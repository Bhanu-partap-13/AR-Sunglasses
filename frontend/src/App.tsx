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
      return this.props.fallback || (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--color-bg-primary)',
        }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
            Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--color-gold)',
              border: 'none',
              borderRadius: '9999px',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      )
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

// Section loading placeholder
const SectionLoader = () => (
  <div className="section-loader">
    <div className="loader-spinner"></div>
    <span>Loading...</span>
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
        <Footer />
      </div>
    </div>
  )
}

export default App

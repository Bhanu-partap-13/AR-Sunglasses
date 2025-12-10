import { Suspense, lazy } from 'react'

// Lazy loaded sections for performance
const Hero = lazy(() => import('../components/Hero/Hero'))
const Features = lazy(() => import('../components/Features/Features'))
const Customizer = lazy(() => import('../components/Customizer/Customizer'))

// Section loading placeholder
const SectionLoader = () => (
  <div className="section-loader">
    <div className="loader-spinner"></div>
    <span>Loading...</span>
  </div>
)

const HomePage = () => {
  return (
    <main className="main-content">
      <Suspense fallback={<SectionLoader />}>
        <Hero />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <Features />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <Customizer />
      </Suspense>
    </main>
  )
}

export default HomePage

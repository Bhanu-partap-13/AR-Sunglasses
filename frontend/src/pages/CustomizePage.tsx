import { Suspense, lazy } from 'react'

// Lazy loaded Customizer
const Customizer = lazy(() => import('../components/Customizer/Customizer'))

// Section loading placeholder
const SectionLoader = () => (
  <div className="section-loader">
    <div className="loader-spinner"></div>
    <span>Loading...</span>
  </div>
)

const CustomizePage = () => {
  return (
    <main className="main-content customize-page">
      <Suspense fallback={<SectionLoader />}>
        <Customizer />
      </Suspense>
    </main>
  )
}

export default CustomizePage

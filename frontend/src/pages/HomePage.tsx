import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'

// Lazy loaded sections for performance
const Hero = lazy(() => import('../components/Hero/Hero'))
const DomeGallery = lazy(() => import('../components/Hero/DomeGallery'))
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
        <Customizer />
      </Suspense>
      
      {/* Full Width Dome Gallery Section */}
      <Suspense fallback={<SectionLoader />}>
        <section className="dome-gallery-section">
          <motion.div 
            className="dome-gallery-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <DomeGallery 
              overlayBlurColor="#0a0a0a"
              grayscale={false}
              imageBorderRadius="16px"
              openedImageBorderRadius="20px"
              openedImageWidth="450px"
              openedImageHeight="450px"
              fit={0.55}
              minRadius={400}
              segments={30}
            />
          </motion.div>
        </section>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <Features />
      </Suspense>
    </main>
  )
}

export default HomePage

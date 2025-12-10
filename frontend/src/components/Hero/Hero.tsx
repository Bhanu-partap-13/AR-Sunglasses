import { useRef, memo } from 'react'
import { motion } from 'framer-motion'
import DomeGallery from './DomeGallery'
import './Hero.scss'

const Hero: React.FC = memo(() => {
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section id="hero" className="hero-section" ref={sectionRef}>
      <div className="hero-background">
        <div className="gradient-overlay"></div>
      </div>

      <div className="hero-content">
        <motion.div 
          className="hero-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="hero-tagline">See the world with your perspective</span>
          <h1 className="hero-title">
            <span className="title-line">Discover</span>
            <span className="title-line accent">Premium</span>
            <span className="title-line">Eyewear</span>
          </h1>
          <p className="hero-description">
            Experience the pinnacle of craftsmanship and innovation. 
            Each piece is meticulously designed for those who demand excellence.
          </p>
          <div className="hero-cta">
            <a href="#customize" className="btn btn-primary">
              <span>Customize Your Pair</span>
            </a>
          </div>
        </motion.div>

        <motion.div 
          className="hero-3d-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
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
      </div>
    </section>
  )
})

Hero.displayName = 'Hero'

export default Hero

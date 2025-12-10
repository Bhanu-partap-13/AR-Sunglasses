import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Features.scss'

gsap.registerPlugin(ScrollTrigger)

// Feature data with titles, descriptions, and placeholder images
const features = [
  {
    id: 1,
    title: '3D Showcase',
    subtitle: 'Immersive Experience',
    description: 'Explore every angle of our premium eyewear collection with photorealistic 3D rendering. Rotate, zoom, and inspect the finest details of craftsmanship.',
    image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1280&q=80',
    icon: '🎨',
    color: '#D4AF37'
  },
  {
    id: 2,
    title: 'AR View',
    subtitle: 'Try Before You Buy',
    description: 'Use augmented reality to see how each frame looks on your face. Our advanced face-tracking technology ensures a perfect virtual fit.',
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1280&q=80',
    icon: '👓',
    color: '#B76E79'
  },
  {
    id: 3,
    title: 'Custom Design',
    subtitle: 'Make It Yours',
    description: 'Personalize your eyewear with our intuitive customization tool. Choose from premium materials, exclusive colors, and unique lens options.',
    image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1280&q=80',
    icon: '✨',
    color: '#C0C0C0'
  },
  {
    id: 4,
    title: 'Smart Analytics',
    subtitle: 'Data-Driven Insights',
    description: 'Track your preferences, explore trending styles, and receive personalized recommendations powered by machine learning.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&q=80',
    icon: '📊',
    color: '#10B981'
  }
]

const Features: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // Animate header
    gsap.fromTo(
      '.features-header',
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.features-header',
          start: 'top 80%',
        }
      }
    )

    // Parallax effect for each card
    cardsRef.current.forEach((card, index) => {
      if (!card) return

      const image = card.querySelector('.feature-image img')
      const content = card.querySelector('.feature-content')
      const isEven = index % 2 === 0

      // Card entrance animation
      gsap.fromTo(
        card,
        { 
          opacity: 0, 
          x: isEven ? -100 : 100,
          rotateY: isEven ? -5 : 5 
        },
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            end: 'top 30%',
            toggleActions: 'play none none reverse'
          }
        }
      )

      // Parallax on image
      if (image) {
        gsap.fromTo(
          image,
          { yPercent: -15, scale: 1.2 },
          {
            yPercent: 15,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1
            }
          }
        )
      }

      // Content parallax (slower than image for depth effect)
      if (content) {
        gsap.fromTo(
          content,
          { yPercent: 10 },
          {
            yPercent: -10,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5
            }
          }
        )
      }
    })

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <section id="features" className="features-section" ref={sectionRef}>
      <div className="features-container">
        {/* Header */}
        <div className="features-header">
          <span className="section-label">Capabilities</span>
          <h2 className="section-title">
            Premium <span className="accent">Features</span>
          </h2>
          <p className="section-description">
            Discover the cutting-edge technology that powers your eyewear experience
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`feature-card ${index % 2 === 0 ? 'left' : 'right'}`}
              ref={(el) => { cardsRef.current[index] = el }}
              style={{ '--accent-color': feature.color } as React.CSSProperties}
            >
              {/* Image Container - 16:9 Aspect Ratio */}
              <div className="feature-image">
                <img src={feature.image} alt={feature.title} loading="lazy" />
                <div className="image-overlay" />
                <span className="feature-number">{String(index + 1).padStart(2, '0')}</span>
              </div>

              {/* Content */}
              <div className="feature-content">
                <div className="content-header">
                  <span className="feature-icon">{feature.icon}</span>
                  <span className="feature-subtitle">{feature.subtitle}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                
                <button className="feature-cta">
                  <span>Learn More</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background decorations */}
      <div className="features-bg">
        <div className="bg-gradient" />
        <div className="bg-grid" />
      </div>
    </section>
  )
}

export default Features

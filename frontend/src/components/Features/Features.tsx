import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Features.scss'

gsap.registerPlugin(ScrollTrigger)

// Feature data with titles, descriptions, and high-quality images
const features = [
  {
    id: 1,
    title: 'Designed for the Perfect Fit',
    subtitle: 'Tailored to Complement Asian Beauty',
    description: 'No slipping, no discomfort—just sunglasses that truly fit. Our frames are precisely engineered with optimized nose bridges and temple angles for Asian face shapes.',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=2400&q=95&auto=format&fit=crop',
    color: '#D4AF37'
  },
  {
    id: 2,
    title: 'Premium Materials & Craftsmanship',
    subtitle: 'Handcrafted Excellence',
    description: 'Each frame is meticulously crafted from premium acetate and titanium, ensuring durability that matches its sophisticated aesthetics. Every detail matters.',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=2400&q=95&auto=format&fit=crop',
    color: '#B76E79'
  },
  {
    id: 3,
    title: 'Superior UV Protection',
    subtitle: 'Guard Your Vision',
    description: 'Our lenses provide 100% UVA and UVB protection with advanced polarization technology, keeping your eyes safe while maintaining crystal-clear vision.',
    image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=2400&q=95&auto=format&fit=crop',
    color: '#C0C0C0'
  },
  {
    id: 4,
    title: 'Timeless Design Philosophy',
    subtitle: 'Classic Meets Contemporary',
    description: 'Our designs blend timeless elegance with modern innovation, creating eyewear that transcends trends and becomes your signature style statement.',
    image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=2400&q=95&auto=format&fit=crop',
    color: '#8B7220'
  }
]

const Features: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const textItemsRef = useRef<(HTMLDivElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!sectionRef.current || !imageContainerRef.current) return

    const images = imageContainerRef.current.querySelectorAll('.feature-image-item')

    // Setup scroll-triggered image transitions
    textItemsRef.current.forEach((item, index) => {
      if (!item) return

      ScrollTrigger.create({
        trigger: item,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          setActiveIndex(index)
          // Fade out all images
          gsap.to(images, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.inOut'
          })
          // Fade in current image
          gsap.to(images[index], {
            opacity: 1,
            duration: 0.6,
            delay: 0.2,
            ease: 'power2.out'
          })
        },
        onEnterBack: () => {
          setActiveIndex(index)
          gsap.to(images, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.inOut'
          })
          gsap.to(images[index], {
            opacity: 1,
            duration: 0.6,
            delay: 0.2,
            ease: 'power2.out'
          })
        }
      })

      // Animate text items on scroll
      gsap.fromTo(
        item,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      )
    })

    // Pin the image container only within features section
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom bottom',
      pin: imageContainerRef.current,
      pinSpacing: false,
      anticipatePin: 1
    })

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <section id="features" className="features-section" ref={sectionRef}>
      <div className="features-container">
        {/* Fixed Image Panel - Left Side */}
        <div className="features-image-panel" ref={imageContainerRef}>
          <div className="image-wrapper">
            {features.map((feature, index) => (
              <div 
                key={feature.id} 
                className={`feature-image-item ${activeIndex === index ? 'active' : ''}`}
                style={{ '--accent-color': feature.color } as React.CSSProperties}
              >
                <img src={feature.image} alt={feature.title} loading="lazy" />
                <div className="image-accent-border" />
              </div>
            ))}
          </div>
        </div>

        {/* Scrolling Text Content - Right Side */}
        <div className="features-text-panel">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              ref={(el) => { textItemsRef.current[index] = el }}
              className="feature-text-item"
              style={{ '--feature-color': feature.color } as React.CSSProperties}
            >
              <div className="feature-number">0{index + 1}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-subtitle">{feature.subtitle}</p>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-accent-line" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features

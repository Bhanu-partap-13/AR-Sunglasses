import { motion } from 'framer-motion'
import './Features.scss'

// Feature data
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

const FeatureItem = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  const isEven = index % 2 === 0
  
  return (
    <motion.div 
      className={`feature-row ${isEven ? 'row-even' : 'row-odd'}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="feature-content">
        <div className="feature-text-wrapper">
          <span className="feature-number" style={{ color: feature.color }}>0{feature.id}</span>
          <h3 className="feature-title">{feature.title}</h3>
          <h4 className="feature-subtitle" style={{ color: feature.color }}>{feature.subtitle}</h4>
          <p className="feature-description">{feature.description}</p>
          <div className="feature-accent-line" style={{ background: `linear-gradient(90deg, ${feature.color}, transparent)` }}></div>
        </div>
      </div>
      
      <div className="feature-image-container">
        <div className="image-wrapper">
          <img src={feature.image} alt={feature.title} loading="lazy" />
          <div className="image-overlay"></div>
          <div className="image-border" style={{ borderColor: feature.color }}></div>
        </div>
      </div>
    </motion.div>
  )
}

const Features: React.FC = () => {
  return (
    <section className="features-section">
      <div className="features-container">
        <div className="features-header">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            Why Choose <span className="accent">Luxe Optics</span>
          </motion.h2>
        </div>
        
        <div className="features-list">
          {features.map((feature, index) => (
            <FeatureItem key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features

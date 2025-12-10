import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import './Collections.scss'

// Sunglasses product data - maps to 3D models
const products = [
  {
    id: 1,
    productId: 'glasses1',
    name: 'Aviator Elite Sunglasses',
    collection: 'Classic',
    price: '$899',
    material: 'Titanium',
    modelPath: '/models/glasses1.glb',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    size: 'large'
  },
  {
    id: 2,
    productId: 'glasses-8b',
    name: 'Metropolitan Shades',
    collection: 'Modern',
    price: '$1,299',
    material: 'Carbon Fiber',
    modelPath: '/models/glasses-8b.glb',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
    size: 'regular'
  },
  {
    id: 3,
    productId: 'glasses-8c',
    name: 'Vintage Round Sunglasses',
    collection: 'Vintage',
    price: '$799',
    material: 'Acetate',
    modelPath: '/models/glasses-8c.glb',
    image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80',
    size: 'large'
  },
  {
    id: 4,
    productId: 'glasses6',
    name: 'Sport Shield Sunglasses',
    collection: 'Sport',
    price: '$1,099',
    material: 'Aluminum',
    modelPath: '/models/glasses6.glb',
    image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=80',
    size: 'regular'
  },
  {
    id: 5,
    productId: 'glasses-7b',
    name: 'Wayfarer Luxe Sunglasses',
    collection: 'Classic',
    price: '$1,499',
    material: 'Gold Plated',
    modelPath: '/models/glasses-7b.glb',
    image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80',
    size: 'regular'
  },
  {
    id: 6,
    productId: 'glasses-7c',
    name: 'Cat Eye Sunglasses',
    collection: 'Modern',
    price: '$999',
    material: 'Acetate',
    modelPath: '/models/glasses-7c.glb',
    image: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&q=80',
    size: 'large'
  },
  {
    id: 7,
    productId: 'glasses-9b',
    name: 'Urban Sport Sunglasses',
    collection: 'Sport',
    price: '$1,199',
    material: 'Polycarbonate',
    modelPath: '/models/glasses-9b.glb',
    image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&q=80',
    size: 'regular'
  },
  {
    id: 8,
    productId: 'glasses-9c',
    name: 'Retro Square Sunglasses',
    collection: 'Vintage',
    price: '$849',
    material: 'Horn',
    modelPath: '/models/glasses-9c.glb',
    image: 'https://images.unsplash.com/photo-1624199632701-514e5c4fab0c?w=800&q=80',
    size: 'regular'
  },
  {
    id: 9,
    productId: 'glasses5',
    name: 'Navigator Sunglasses',
    collection: 'Classic',
    price: '$749',
    material: 'Titanium',
    modelPath: '/models/glasses5.glb',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80',
    size: 'large'
  },
  {
    id: 10,
    productId: 'glasses3',
    name: 'Pilot Sunglasses',
    collection: 'Vintage',
    price: '$699',
    material: 'Acetate',
    modelPath: '/models/glasses3.glb',
    image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80',
    size: 'regular'
  },
  {
    id: 11,
    productId: 'glasses4',
    name: 'Executive Sunglasses',
    collection: 'Modern',
    price: '$1,349',
    material: 'Carbon Fiber',
    modelPath: '/models/glasses4.glb',
    image: 'https://images.unsplash.com/photo-1575248255933-6e8a3edc93a0?w=800&q=80',
    size: 'regular'
  },
  {
    id: 12,
    productId: 'glasses-5b',
    name: 'Active Sport Sunglasses',
    collection: 'Sport',
    price: '$899',
    material: 'Polycarbonate',
    modelPath: '/models/glasses-5b.glb',
    image: 'https://images.unsplash.com/photo-1614715838608-dd527c46231d?w=800&q=80',
    size: 'large'
  },
  {
    id: 13,
    productId: 'glasses-5c',
    name: 'Runner Sunglasses',
    collection: 'Sport',
    price: '$949',
    material: 'Aluminum',
    modelPath: '/models/glasses-5c.glb',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
    size: 'regular'
  },
  {
    id: 14,
    productId: 'glasses-10',
    name: 'Oval Sunglasses',
    collection: 'Vintage',
    price: '$1,099',
    material: 'Horn',
    modelPath: '/models/glasses-10.glb',
    image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&q=80',
    size: 'regular'
  },
  {
    id: 15,
    productId: 'glasses-11b',
    name: 'Edge Sunglasses',
    collection: 'Modern',
    price: '$1,199',
    material: 'Titanium',
    modelPath: '/models/glasses-11b.glb',
    image: 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=800&q=80',
    size: 'large'
  },
  {
    id: 16,
    productId: 'glasses-11c',
    name: 'Bold Sunglasses',
    collection: 'Modern',
    price: '$1,249',
    material: 'Carbon Fiber',
    modelPath: '/models/glasses-11c.glb',
    image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80',
    size: 'regular'
  },
  {
    id: 17,
    productId: 'glasses-12',
    name: 'Heritage Sunglasses',
    collection: 'Classic',
    price: '$999',
    material: 'Gold Plated',
    modelPath: '/models/glasses-12.glb',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
    size: 'regular'
  },
  {
    id: 18,
    productId: 'glasses-7',
    name: 'Square Sunglasses',
    collection: 'Vintage',
    price: '$849',
    material: 'Acetate',
    modelPath: '/models/glasses-7.glb',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    size: 'large'
  },
]

const filters = ['All', 'Classic', 'Modern', 'Vintage', 'Sport']
const materials = ['All Materials', 'Titanium', 'Carbon Fiber', 'Acetate', 'Aluminum', 'Gold Plated']

const Collections: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeMaterial, setActiveMaterial] = useState('All Materials')
  const navigate = useNavigate()

  const filteredProducts = products.filter(product => {
    const collectionMatch = activeFilter === 'All' || product.collection === activeFilter
    const materialMatch = activeMaterial === 'All Materials' || product.material === activeMaterial
    return collectionMatch && materialMatch
  })

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`)
  }

  return (
    <section id="collections" className="collections-section">
      <div className="collections-container">
        <div className="collections-header">
          <span className="section-label">Our Collections</span>
          <h2 className="section-title">
            Curated <span className="accent">Excellence</span>
          </h2>
          <p className="section-description">
            Each piece represents the pinnacle of design and craftsmanship
          </p>
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Collection</label>
            <div className="filter-buttons">
              {filters.map(filter => (
                <button
                  key={filter}
                  className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Material</label>
            <div className="filter-buttons">
              {materials.map(material => (
                <button
                  key={material}
                  className={`filter-btn ${activeMaterial === material ? 'active' : ''}`}
                  onClick={() => setActiveMaterial(material)}
                >
                  {material}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Masonry Grid */}
        <motion.div className="masonry-grid" layout>
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(product => (
              <motion.div
                key={product.id}
                className={`product-card ${product.size}`}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => handleProductClick(product.productId)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-image">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <div className="image-overlay"></div>
                </div>

                <motion.div 
                  className="card-content"
                  initial={{ y: 20, opacity: 0 }}
                  whileHover={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="product-collection">{product.collection}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-material">{product.material}</p>
                  <div className="product-footer">
                    <span className="product-price">{product.price}</span>
                    <span className="view-link">
                      <span>View Details</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="no-results">
            <p>No products found matching your criteria</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Collections

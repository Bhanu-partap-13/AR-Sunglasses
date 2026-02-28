import { useState, useRef, useCallback, Suspense, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Center, Float, Html, useProgress } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import './ProductPage.scss'

// 3D Loading indicator
const Loader = () => {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="canvas-loader">
        <div className="loader-ring"></div>
        <span>{progress.toFixed(0)}%</span>
      </div>
    </Html>
  )
}

// Product data - maps to models in public/models
const productData: Record<string, {
  id: string
  name: string
  collection: string
  price: string
  description: string
  material: string
  features: string[]
  modelPath: string
  colors: { name: string; hex: string }[]
}> = {
  'glasses1': {
    id: 'glasses1',
    name: 'Aviator Elite',
    collection: 'Classic',
    price: '$899',
    description: 'The Aviator Elite represents the pinnacle of timeless design. Crafted with precision titanium frames and premium polarized lenses, this iconic silhouette offers unparalleled clarity and protection.',
    material: 'Premium Titanium',
    features: [
      '100% UV Protection',
      'Polarized Lenses',
      'Lightweight Titanium Frame',
      'Anti-scratch Coating',
      'Adjustable Nose Pads'
    ],
    modelPath: '/models/glasses1.glb',
    colors: [
      { name: 'Matte Black', hex: '#1A1A1A' },
      { name: 'Polished Gold', hex: '#D4AF37' },
      { name: 'Silver', hex: '#C0C0C0' }
    ]
  },
  'glasses5': {
    id: 'glasses5',
    name: 'Heritage Round',
    collection: 'Vintage',
    price: '$799',
    description: 'Inspired by the golden era of eyewear, the Heritage Round combines classic aesthetics with modern technology. The hand-polished acetate frames and crystal lenses create an unmistakable vintage appeal.',
    material: 'Italian Acetate',
    features: [
      'Crystal Clear Lenses',
      'Hand-polished Acetate',
      'Spring Hinges',
      'UV400 Protection',
      'Vintage-inspired Design'
    ],
    modelPath: '/models/glasses5.glb',
    colors: [
      { name: 'Tortoiseshell', hex: '#8B4513' },
      { name: 'Classic Black', hex: '#1A1A1A' },
      { name: 'Champagne', hex: '#F4CF67' }
    ]
  },
  'glasses6': {
    id: 'glasses6',
    name: 'Sport Precision',
    collection: 'Sport',
    price: '$1,099',
    description: 'Engineered for performance, the Sport Precision combines aerodynamic design with cutting-edge lens technology. Perfect for athletes and outdoor enthusiasts who demand the best.',
    material: 'Carbon Fiber Composite',
    features: [
      'Impact Resistant',
      'Anti-fog Coating',
      'Hydrophobic Lens Treatment',
      'Secure Grip Temple Tips',
      'Wraparound Protection'
    ],
    modelPath: '/models/glasses6.glb',
    colors: [
      { name: 'Stealth Black', hex: '#0A0A0A' },
      { name: 'Racing Red', hex: '#8B0000' },
      { name: 'Electric Blue', hex: '#1E3A8A' }
    ]
  },
  'glasses-8b': {
    id: 'glasses-8b',
    name: 'Metropolitan',
    collection: 'Modern',
    price: '$1,299',
    description: 'The Metropolitan redefines modern elegance with its sleek carbon fiber construction and sophisticated design. A perfect blend of cutting-edge technology and refined aesthetics.',
    material: 'Carbon Fiber',
    features: [
      'Ultra-lightweight Carbon Fiber',
      'Photochromic Lenses',
      'Hypoallergenic Materials',
      'Flexible Temple Design',
      'Premium Anti-reflective Coating'
    ],
    modelPath: '/models/glasses-8b.glb',
    colors: [
      { name: 'Midnight Blue', hex: '#1E3A5F' },
      { name: 'Graphite', hex: '#4A4A4A' },
      { name: 'Pearl White', hex: '#F5F5F5' }
    ]
  },
  'glasses-8c': {
    id: 'glasses-8c',
    name: 'Artisan Classic',
    collection: 'Vintage',
    price: '$949',
    description: 'Handcrafted with meticulous attention to detail, the Artisan Classic pays homage to traditional eyewear craftsmanship while incorporating modern comfort features.',
    material: 'Premium Acetate',
    features: [
      'Hand-finished Acetate',
      'Mineral Glass Lenses',
      'Titanium Core Temples',
      'Adjustable Fit System',
      'Vintage-inspired Detailing'
    ],
    modelPath: '/models/glasses-8c.glb',
    colors: [
      { name: 'Havana Brown', hex: '#6B4423' },
      { name: 'Forest Green', hex: '#2D4A3E' },
      { name: 'Amber', hex: '#FFBF00' }
    ]
  },
  'glasses-7b': {
    id: 'glasses-7b',
    name: 'Luxury Wayfarer',
    collection: 'Classic',
    price: '$1,499',
    description: 'The Luxury Wayfarer elevates the iconic silhouette with 18k gold-plated accents and premium materials. A statement piece for those who appreciate timeless luxury.',
    material: 'Gold Plated',
    features: [
      '18K Gold Plated Accents',
      'Polarized Premium Lenses',
      'Italian Craftsmanship',
      'Signature Engraving',
      'Deluxe Leather Case Included'
    ],
    modelPath: '/models/glasses-7b.glb',
    colors: [
      { name: 'Black Gold', hex: '#1A1A1A' },
      { name: 'Ivory Gold', hex: '#FFFFF0' },
      { name: 'Rose Gold', hex: '#B76E79' }
    ]
  },
  'glasses-7c': {
    id: 'glasses-7c',
    name: 'Designer Cat Eye',
    collection: 'Modern',
    price: '$999',
    description: 'Bold and sophisticated, the Designer Cat Eye makes a statement with its dramatic silhouette and premium acetate construction. Perfect for fashion-forward individuals.',
    material: 'Designer Acetate',
    features: [
      'Bold Cat Eye Silhouette',
      'Multi-layer Acetate',
      'Gradient Lenses Available',
      'Spring-loaded Hinges',
      'Signature Temple Design'
    ],
    modelPath: '/models/glasses-7c.glb',
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Burgundy', hex: '#722F37' },
      { name: 'Tortoise', hex: '#8B4513' }
    ]
  },
  'glasses-9b': {
    id: 'glasses-9b',
    name: 'Urban Shield',
    collection: 'Sport',
    price: '$1,199',
    description: 'Built for the urban athlete, the Urban Shield offers maximum protection and style. Impact-resistant polycarbonate construction ensures durability in any environment.',
    material: 'Polycarbonate',
    features: [
      'Impact-resistant Frame',
      'Wraparound Protection',
      'Ventilated Design',
      'Rubberized Grip',
      'Interchangeable Lenses'
    ],
    modelPath: '/models/glasses-9b.glb',
    colors: [
      { name: 'Tactical Black', hex: '#1A1A1A' },
      { name: 'Neon Orange', hex: '#FF6B35' },
      { name: 'Electric Yellow', hex: '#FFD700' }
    ]
  },
  'glasses-9c': {
    id: 'glasses-9c',
    name: 'Vintage Square',
    collection: 'Vintage',
    price: '$849',
    description: 'The Vintage Square captures the essence of mid-century design with its distinctive angular frame. Crafted from genuine horn for an authentic retro look.',
    material: 'Natural Horn',
    features: [
      'Genuine Horn Material',
      'Unique Natural Patterns',
      'Crystal Lenses',
      'Handmade Construction',
      'Collector\'s Edition'
    ],
    modelPath: '/models/glasses-9c.glb',
    colors: [
      { name: 'Natural Horn', hex: '#5C4033' },
      { name: 'Dark Horn', hex: '#3C2415' },
      { name: 'Blonde Horn', hex: '#C4A777' }
    ]
  },
  'glasses3': {
    id: 'glasses3',
    name: 'Pilot Classic',
    collection: 'Vintage',
    price: '$699',
    description: 'Timeless pilot-style frames with a retro aesthetic and modern durability.',
    material: 'Acetate',
    features: ['Classic Pilot Shape', 'UV400 Protection', 'Lightweight Frame', 'Anti-scratch Lenses', 'Spring Hinges'],
    modelPath: '/models/glasses3.glb',
    colors: [{ name: 'Matte Black', hex: '#1A1A1A' }, { name: 'Tortoiseshell', hex: '#8B4513' }, { name: 'Gold', hex: '#D4AF37' }]
  },
  'glasses4': {
    id: 'glasses4',
    name: 'Executive',
    collection: 'Modern',
    price: '$1,349',
    description: 'Sleek executive frames crafted for the discerning professional. Clean lines meet premium materials.',
    material: 'Carbon Fiber',
    features: ['Executive Profile', 'Carbon Fiber Frame', 'Anti-reflective Lenses', 'Titanium Hinges', 'Premium Case'],
    modelPath: '/models/glasses4.glb',
    colors: [{ name: 'Graphite', hex: '#4A4A4A' }, { name: 'Polished Gold', hex: '#D4AF37' }, { name: 'Midnight', hex: '#0A0A0A' }]
  },
  'glasses-1-': {
    id: 'glasses-1-',
    name: 'Signature One',
    collection: 'Classic',
    price: '$1,099',
    description: 'The Signature One is the cornerstone of the collection — a frame that defines elegance and precision.',
    material: 'Titanium',
    features: ['Titanium Construction', 'Polarized Lenses', '100% UV Protection', 'Adjustable Nose Pads', 'Signature Engravings'],
    modelPath: '/models/glasses-1-.glb',
    colors: [{ name: 'Polished Silver', hex: '#C0C0C0' }, { name: 'Matte Black', hex: '#1A1A1A' }, { name: 'Gold', hex: '#D4AF37' }]
  },
  'glasses-5b': {
    id: 'glasses-5b',
    name: 'Active Sport',
    collection: 'Sport',
    price: '$899',
    description: 'Engineered for peak performance, the Active Sport frames deliver uncompromising protection.',
    material: 'Polycarbonate',
    features: ['Impact Resistant', 'Non-slip Temple Tips', 'UV400 Lenses', 'Ventilated Frame', 'Lightweight Design'],
    modelPath: '/models/glasses-5b.glb',
    colors: [{ name: 'Stealth Black', hex: '#0A0A0A' }, { name: 'Racing Red', hex: '#8B0000' }, { name: 'Electric Blue', hex: '#1E3A8A' }]
  },
  'glasses-5c': {
    id: 'glasses-5c',
    name: 'Runner Pro',
    collection: 'Sport',
    price: '$949',
    description: 'Designed for runners and cyclists who demand the best in eyewear performance.',
    material: 'Aluminum',
    features: ['Aerodynamic Design', 'Hydrophobic Coating', 'Anti-fog Lenses', 'Secure Fit System', 'Interchangeable Lenses'],
    modelPath: '/models/glasses-5c.glb',
    colors: [{ name: 'Matte Black', hex: '#1A1A1A' }, { name: 'Team White', hex: '#F5F5F5' }, { name: 'Neon Green', hex: '#39FF14' }]
  },
  'glasses-6': {
    id: 'glasses-6',
    name: 'Shield Sport',
    collection: 'Sport',
    price: '$1,049',
    description: 'Full-shield wraparound protection for extreme sports and outdoor adventures.',
    material: 'Polycarbonate',
    features: ['Full Shield Design', 'Impact Resistant', 'Anti-scratch Coating', 'UV400 Protection', 'Rubberized Grip'],
    modelPath: '/models/glasses-6.glb',
    colors: [{ name: 'Stealth Black', hex: '#0A0A0A' }, { name: 'Smoke Grey', hex: '#4A4A4A' }, { name: 'Arctic White', hex: '#F0F0F0' }]
  },
  'glasses-7': {
    id: 'glasses-7',
    name: 'Square Frame',
    collection: 'Vintage',
    price: '$849',
    description: 'Bold square frames inspired by the icons of the golden era of fashion.',
    material: 'Acetate',
    features: ['Bold Square Silhouette', 'Thick Acetate Frame', 'Crystal Clear Lenses', 'Spring Hinges', 'Vintage Hardware'],
    modelPath: '/models/glasses-7.glb',
    colors: [{ name: 'Classic Black', hex: '#1A1A1A' }, { name: 'Tortoiseshell', hex: '#8B4513' }, { name: 'Crystal Clear', hex: '#F5F5F5' }]
  },
  'glasses-10': {
    id: 'glasses-10',
    name: 'Oval Luxe',
    collection: 'Vintage',
    price: '$1,099',
    description: 'Refined oval frames with a sophisticated character. Subtle luxury at its finest.',
    material: 'Natural Horn',
    features: ['Oval Frame Shape', 'Horn Material', 'Crystal Lenses', 'Delicate Detailing', 'Handcrafted'],
    modelPath: '/models/glasses-10.glb',
    colors: [{ name: 'Natural Horn', hex: '#5C4033' }, { name: 'Dark Horn', hex: '#3C2415' }, { name: 'Blonde Horn', hex: '#C4A777' }]
  },
  'glasses-11b': {
    id: 'glasses-11b',
    name: 'Edge Series B',
    collection: 'Modern',
    price: '$1,199',
    description: 'Sharp angular geometry meets luxurious materials in the Edge Series B.',
    material: 'Titanium',
    features: ['Angular Design', 'Titanium Frame', 'Photochromic Lenses', 'Featherweight Build', 'Premium Hinges'],
    modelPath: '/models/glasses-11b.glb',
    colors: [{ name: 'Brushed Titanium', hex: '#878681' }, { name: 'Matte Black', hex: '#1A1A1A' }, { name: 'Rose Gold', hex: '#B76E79' }]
  },
  'glasses-11c': {
    id: 'glasses-11c',
    name: 'Bold Series C',
    collection: 'Modern',
    price: '$1,249',
    description: 'Make a statement with the Bold Series C — unapologetically modern, undeniably striking.',
    material: 'Carbon Fiber',
    features: ['Bold Oversized Frame', 'Carbon Fiber Build', 'Gradient Lenses', 'Gold-tone Accents', 'Limited Edition'],
    modelPath: '/models/glasses-11c.glb',
    colors: [{ name: 'Carbon Black', hex: '#1C1C1C' }, { name: 'Pearl White', hex: '#F5F5F5' }, { name: 'Amber Gold', hex: '#FFBF00' }]
  },
  'glasses-12': {
    id: 'glasses-12',
    name: 'Heritage Gold',
    collection: 'Classic',
    price: '$999',
    description: 'A homage to the golden age of eyewear, the Heritage Gold combines timeless design with modern craftsmanship.',
    material: 'Gold Plated',
    features: ['Gold Plated Frame', 'Mineral Glass Lenses', 'Italian Acetate Arms', 'UV400 Protection', 'Signature Case'],
    modelPath: '/models/glasses-12.glb',
    colors: [{ name: 'Yellow Gold', hex: '#D4AF37' }, { name: 'Rose Gold', hex: '#B76E79' }, { name: 'Silver', hex: '#C0C0C0' }]
  },
  'sunglass': {
    id: 'sunglass',
    name: 'Classic Sunglass',
    collection: 'Classic',
    price: '$699',
    description: 'A staple for every wardrobe — the Classic Sunglass pairs effortless style with everyday functionality.',
    material: 'Acetate',
    features: ['Timeless Shape', 'UV400 Lenses', 'Lightweight Acetate', 'Adjustable Nose Pads', 'Anti-scratch Coating'],
    modelPath: '/models/sunglass.glb',
    colors: [{ name: 'Classic Black', hex: '#1A1A1A' }, { name: 'Tortoiseshell', hex: '#8B4513' }, { name: 'Crystal', hex: '#F5F5F5' }]
  },
  'sunglasses': {
    id: 'sunglasses',
    name: 'Premium Sunglasses',
    collection: 'Modern',
    price: '$949',
    description: 'Premium construction meets contemporary design. The ultimate all-day sunglasses for the modern era.',
    material: 'Carbon Fiber',
    features: ['Premium Carbon Frame', 'Polarized Lenses', 'UV400 Protection', 'Featherweight Build', 'Signature Hardware'],
    modelPath: '/models/sunglasses.glb',
    colors: [{ name: 'Stealth Black', hex: '#0A0A0A' }, { name: 'Gunmetal', hex: '#4A4A4A' }, { name: 'Gold', hex: '#D4AF37' }]
  }
}

// Frame colors for customization
const frameColors = [
  { name: 'Matte Black', color: '#1A1A1A', metalness: 0, roughness: 0.9 },
  { name: 'Polished Gold', color: '#D4AF37', metalness: 1, roughness: 0.1 },
  { name: 'Rose Gold', color: '#B76E79', metalness: 1, roughness: 0.15 },
  { name: 'Silver', color: '#C0C0C0', metalness: 1, roughness: 0.2 },
]

// 3D Glasses Model Component
const GlassesModel = ({ 
  modelPath, 
  frameColor 
}: { 
  modelPath: string
  frameColor: typeof frameColors[0]
}) => {
  const { scene } = useGLTF(modelPath)
  
  const configuredScene = useMemo(() => {
    const clonedScene = scene.clone()
    
    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2.5 / maxDim
    
    clonedScene.scale.setScalar(scale)
    
    const newBox = new THREE.Box3().setFromObject(clonedScene)
    const newCenter = newBox.getCenter(new THREE.Vector3())
    clonedScene.position.sub(newCenter)

    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        const meshName = child.name.toLowerCase()
        const isLens = meshName.includes('lens') || meshName.includes('glass')
        
        if (isLens) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: '#374151',
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.6,
            thickness: 1.5,
            opacity: 1, // Keep fully opaque for proper transmission
            transparent: true,
            side: THREE.DoubleSide, // Essential so lenses aren't invisible from back
            depthWrite: false, 
            envMapIntensity: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
          })
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: frameColor.color,
            metalness: frameColor.metalness,
            roughness: frameColor.roughness,
          })
        }
      }
    })
    
    return clonedScene
  }, [scene, frameColor])

  return (
    <Center>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <primitive object={configuredScene} />
      </Float>
    </Center>
  )
}

// Screenshot handler
const ScreenshotHandler = ({ onReady }: { onReady: (fn: () => void) => void }) => {
  const { gl, scene, camera } = useThree()
  
  const takeScreenshot = useCallback(() => {
    gl.render(scene, camera)
    const dataURL = gl.domElement.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `nexus-optics-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }, [gl, scene, camera])

  useEffect(() => {
    onReady(takeScreenshot)
  }, [takeScreenshot, onReady])

  return null
}

const ProductPage = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const [selectedColor, setSelectedColor] = useState(0)
  const screenshotRef = useRef<(() => void) | null>(null)
  
  const product = productId ? productData[productId] : null

  const handleScreenshotReady = useCallback((fn: () => void) => {
    screenshotRef.current = fn
  }, [])

  const handleCaptureClick = useCallback(() => {
    if (screenshotRef.current) {
      screenshotRef.current()
    }
  }, [])

  if (!product) {
    return (
      <main className="main-content product-page">
        <div className="product-not-found">
          <h1>Product Not Found</h1>
          <p>The product you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/collection')} className="back-btn">
            Back to Collection
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="main-content product-page">
      <div className="product-container">
        {/* Back Button */}
        <motion.button 
          className="back-button"
          onClick={() => navigate('/collection')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back to Collection</span>
        </motion.button>

        <div className="product-layout">
          {/* 3D Viewer Section */}
          <motion.div 
            className="product-viewer"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="viewer-wrapper">
              <Canvas 
                shadows 
                dpr={[1, 2]}
                gl={{ 
                  antialias: true, 
                  powerPreference: 'high-performance',
                  alpha: true
                }}
                style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8F8 100%)' }}
              >
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={35} />
                <OrbitControls 
                  enableZoom={true}
                  minDistance={0.5}
                  maxDistance={50}
                  enablePan={true}
                  enableDamping
                  dampingFactor={0.05}
                  zoomSpeed={1.2}
                />
                
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
                <directionalLight position={[-5, 4, -5]} intensity={0.6} />
                <pointLight position={[0, 10, -8]} intensity={0.8} color="#ffffff" />
                <spotLight position={[8, 8, 8]} angle={0.4} penumbra={1} intensity={0.5} color="#D4AF37" />
                
                <Environment preset="studio" background={false} />
                
                <Suspense fallback={<Loader />}>
                  <GlassesModel 
                    modelPath={product.modelPath}
                    frameColor={frameColors[selectedColor]}
                  />
                </Suspense>
                
                <ScreenshotHandler onReady={handleScreenshotReady} />
              </Canvas>
            </div>

            {/* Color Selection */}
            <div className="color-selector">
              <span className="color-label">Frame Color</span>
              <div className="color-options">
                {frameColors.map((color, idx) => (
                  <button
                    key={idx}
                    className={`color-option ${selectedColor === idx ? 'active' : ''}`}
                    onClick={() => setSelectedColor(idx)}
                    style={{ '--color': color.color } as React.CSSProperties}
                  >
                    <span className="color-swatch" style={{ backgroundColor: color.color }}></span>
                    <span className="color-name">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Capture Button */}
            <button className="capture-btn" onClick={handleCaptureClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>Capture Design</span>
            </button>

            {/* Try AR Button */}
            <button 
              className="try-ar-btn" 
              onClick={() => navigate(`/ar/${productId}`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>Try AR</span>
              <span className="ar-badge">LIVE</span>
            </button>
          </motion.div>

          {/* Product Details Section */}
          <motion.div 
            className="product-details"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <span className="product-collection">{product.collection}</span>
            <h1 className="product-name">{product.name}</h1>
            <p className="product-price">{product.price}</p>
            
            <div className="product-description">
              <p>{product.description}</p>
            </div>

            <div className="product-info">
              <div className="info-item">
                <span className="info-label">Material</span>
                <span className="info-value">{product.material}</span>
              </div>
            </div>

            <div className="product-features">
              <h3>Features</h3>
              <ul>
                {product.features.map((feature, idx) => (
                  <li key={idx}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="product-actions">
              <button 
                className="customize-btn"
                onClick={() => navigate('/customize')}
              >
                <span>Customize in 3D</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="add-to-cart-btn">
                Add to Cart
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

export default ProductPage

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import './ARTryOnPage.scss'

// AR config for glasses positioning
// In MindAR: face width = 1 unit
// Glasses should be ~0.5-0.65 units wide to properly fit face
// positionY: vertical offset (positive = up from nose bridge)  
// positionZ: depth offset (positive = towards face, negative = away from face)
// rotationX: tilt adjustment in radians
const defaultArConfig = {
  scale: 1.0,          // Multiplier for final glasses width
  targetWidth: 0.55,   // Target width in face units (0.5-0.65 typical for glasses)
  positionY: 0.08,     // Move up to align with eyes (nose bridge is anchor, eyes are above)
  positionZ: -0.02,    // Slight offset forward from face
  rotationX: 0.05,     // Slight tilt down to follow face angle
}

// Product data - same as ProductPage for consistency
const productData: Record<string, {
  id: string
  name: string
  modelPath: string
  arConfig: {
    scale: number
    targetWidth: number
    positionY: number
    positionZ: number
    rotationX: number
  }
}> = {
  'glasses1': {
    id: 'glasses1',
    name: 'Aviator Elite',
    modelPath: '/models/glasses1.glb',
    arConfig: { ...defaultArConfig, targetWidth: 0.58, positionY: 0.06 }
  },
  'glasses5': {
    id: 'glasses5',
    name: 'Heritage Round',
    modelPath: '/models/glasses5.glb',
    arConfig: { ...defaultArConfig, targetWidth: 0.52, positionY: 0.07 }
  },
  'glasses6': {
    id: 'glasses6',
    name: 'Sport Precision',
    modelPath: '/models/glasses6.glb',
    arConfig: { ...defaultArConfig, targetWidth: 0.60, positionY: 0.05 }
  },
  'glasses-8b': {
    id: 'glasses-8b',
    name: 'Metropolitan',
    modelPath: '/models/glasses-8b.glb',
    arConfig: { ...defaultArConfig, targetWidth: 0.55, positionY: 0.075 }
  },
  'glasses-8c': {
    id: 'glasses-8c',
    name: 'Artisan Classic',
    modelPath: '/models/glasses-8c.glb',
    arConfig: { ...defaultArConfig, targetWidth: 0.55, positionY: 0.075 }
  },
  'glasses-7b': {
    id: 'glasses-7b',
    name: 'Luxury Wayfarer',
    modelPath: '/models/glasses-7b.glb',
    arConfig: { ...defaultArConfig, targetWidth: 0.56, positionY: 0.07 }
  },
  'glasses-7c': {
    id: 'glasses-7c',
    name: 'Designer Cat Eye',
    modelPath: '/models/glasses-7c.glb',
    arConfig: { ...defaultArConfig, targetWidth: 0.54, positionY: 0.08 }
  },
  'glasses-9b': {
    id: 'glasses-9b',
    name: 'Urban Shield',
    modelPath: '/models/glasses-9b.glb',
    arConfig: { ...defaultArConfig, targetWidth: 0.58, positionY: 0.06 }
  },
  'glasses-9c': {
    id: 'glasses-9c',
    name: 'Vintage Square',
    modelPath: '/models/glasses-9c.glb',
    arConfig: { ...defaultArConfig, targetWidth: 0.54, positionY: 0.07 }
  }
}

const ARTryOnPage = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const mindarRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isInitializing = useRef(false)
  const glassesGroupRef = useRef<any>(null) // Ref to store glasses group for dynamic resizing
  const baseScaleRef = useRef<number>(1) // Store the base scale factor
  
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isARActive, setIsARActive] = useState(false)
  const [isCaptured, setIsCaptured] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const product = productId ? productData[productId] : null

  // Initialize MindAR face tracking
  const initMindAR = useCallback(async () => {
    if (!containerRef.current || !product || isInitializing.current) return
    isInitializing.current = true

    try {
      setIsLoading(true)
      setErrorMessage(null)

      // First check for camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        stream.getTracks().forEach(track => track.stop()) // Stop test stream
      } catch (camError: any) {
        console.error('Camera access error:', camError)
        isInitializing.current = false
        setIsLoading(false)
        if (camError.name === 'NotAllowedError') {
          setHasPermission(false)
          setErrorMessage('Camera access was denied. Please allow camera access to use AR try-on.')
        } else if (camError.name === 'NotFoundError') {
          setErrorMessage('No camera found. Please connect a camera to use AR try-on.')
        } else {
          setErrorMessage('Cannot access camera. Please check your browser permissions.')
        }
        return
      }

      // Load MindAR from CDN
      if (!(window as any).MINDAR?.FACE?.MindARThree) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-face-three.prod.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load MindAR'))
          document.head.appendChild(script)
        })
      }

      const MindARThree = (window as any).MINDAR.FACE.MindARThree

      // Create MindAR instance with face tracking
      // Use filter settings for smoother tracking (less jitter)
      const mindarThree = new MindARThree({
        container: containerRef.current,
        filterMinCF: 0.0001,  // Lower = more stable but slower response
        filterBeta: 10,       // Higher = faster response but more jitter
      })

      mindarRef.current = mindarThree

      const { renderer, scene, camera } = mindarThree

      // Configure renderer for better visibility
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2

      // Add comprehensive lighting for realistic glasses rendering
      // Ambient light for base visibility
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
      scene.add(ambientLight)

      // Main key light from front-top
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
      keyLight.position.set(0, 1, 2)
      scene.add(keyLight)

      // Fill light from side to reduce harsh shadows
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.8)
      fillLight.position.set(1, 0.5, 1)
      scene.add(fillLight)

      // Rim light from behind for edge definition
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.5)
      rimLight.position.set(0, 0, -1)
      scene.add(rimLight)

      // Load glasses model
      const loader = new GLTFLoader()
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          product.modelPath,
          resolve,
          (progress) => {
            console.log('Loading model:', (progress.loaded / progress.total * 100).toFixed(0) + '%')
          },
          reject
        )
      })

      const glasses = gltf.scene.clone()
      
      // Get AR config for this specific glasses model
      const arConfig = product.arConfig
      
      // Calculate the bounding box to properly center and scale the glasses
      const box = new THREE.Box3().setFromObject(glasses)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      
      // Log model dimensions for debugging
      console.log('Model original size:', size)
      console.log('Model center:', center)
      
      // In MindAR face tracking:
      // - Face width = 1 unit
      // - Glasses should be about 0.5-0.65 units wide to fit properly
      // - Anchor 168 (nose bridge) is at approximately the center of the face
      
      // Calculate scale to make glasses the target width (in face units)
      // Apply additional scale multiplier from arConfig
      const targetWidth = arConfig.targetWidth * arConfig.scale
      const scaleFactor = targetWidth / size.x
      
      console.log('Target glasses width:', targetWidth, 'face units')
      console.log('Scale factor:', scaleFactor)
      
      glasses.scale.setScalar(scaleFactor)
      
      // Center the glasses model at origin first, then apply position offsets
      // The anchor is at nose bridge, so we need to:
      // 1. Center the model horizontally (X)
      // 2. Move up slightly to align lenses with eyes (Y)  
      // 3. Move forward/back to sit properly on face (Z)
      glasses.position.set(
        -center.x * scaleFactor,                                    // Center horizontally
        -center.y * scaleFactor + arConfig.positionY,               // Center + move up to eyes
        -center.z * scaleFactor + arConfig.positionZ                // Center + depth offset
      )

      // Apply materials to ensure visibility and proper rendering
      glasses.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          // Ensure materials render correctly
          if (child.material) {
            child.material.needsUpdate = true
            child.material.side = THREE.DoubleSide
            // Handle transparency properly
            if (child.material.opacity !== undefined && child.material.opacity < 1) {
              child.material.transparent = true
            }
            // Improve material quality
            if (child.material.metalness !== undefined) {
              child.material.envMapIntensity = 1.0
            }
          }
        }
      })

      // Create a wrapper group to handle rotation separately from position
      const glassesGroup = new THREE.Group()
      glassesGroup.add(glasses)
      
      // Apply rotation to orient glasses correctly on face
      // Small tilt helps glasses follow the natural angle of the face
      glassesGroup.rotation.set(arConfig.rotationX, 0, 0)

      // Store reference for dynamic resizing
      glassesGroupRef.current = glassesGroup
      baseScaleRef.current = 1 // Base scale is 1, user multiplier will adjust

      // Attach glasses to face anchor point
      // MindAR face mesh uses 486 anchor points from MediaPipe
      // Anchor 168 = nose bridge (between eyes) - ideal for glasses
      // Face width = 1 unit in MindAR coordinate system
      const anchor = mindarThree.addAnchor(168)
      anchor.group.add(glassesGroup)

      // Add Face Mesh as occluder to make glasses temples go behind the head/ears
      // This creates a realistic effect where the temples disappear behind the face
      try {
        console.log('Adding face mesh occluder...')
        // Use type assertion since TypeScript types don't include addFaceMesh
        const faceMesh = (mindarThree as any).addFaceMesh()
        
        if (faceMesh) {
          // Create an invisible material that only writes to depth buffer
          // This makes objects behind it invisible while the mesh itself is invisible
          const occluderMaterial = new THREE.MeshBasicMaterial({
            colorWrite: false,  // Don't write color - makes mesh invisible
            depthWrite: true,   // Write to depth buffer - occludes objects behind it
            side: THREE.DoubleSide, // Render both sides
          })
          
          faceMesh.material = occluderMaterial
          
          // Make sure occluder renders before glasses
          faceMesh.renderOrder = -1
          glassesGroup.renderOrder = 0
          
          scene.add(faceMesh)
          console.log('Face occluder mesh successfully added - temples will now go behind ears')
        } else {
          console.warn('faceMesh returned null/undefined')
        }
      } catch (occluderError) {
        console.warn('Could not add face occluder mesh:', occluderError)
        console.warn('Glasses will still work but temples may not hide behind ears realistically')
        // Continue without occluder - glasses will still work but won't hide behind ears
      }

      // Start AR session
      await mindarThree.start()
      
      setIsARActive(true)
      setIsLoading(false)
      setHasPermission(true)
      isInitializing.current = false

      // Render loop with context loss handling
      const render = () => {
        if (!mindarRef.current) return
        try {
          renderer.render(scene, camera)
          animationFrameRef.current = requestAnimationFrame(render)
        } catch (e) {
          console.warn('Render error, stopping AR:', e)
        }
      }
      
      // Handle WebGL context loss
      renderer.domElement.addEventListener('webglcontextlost', (event: Event) => {
        event.preventDefault()
        console.warn('WebGL context lost, stopping render loop')
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        setErrorMessage('Graphics context lost. Please refresh the page to continue.')
      })

      renderer.domElement.addEventListener('webglcontextrestored', () => {
        console.log('WebGL context restored, resuming render')
        setErrorMessage('')
        if (mindarRef.current && !animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(render)
        }
      })
      
      animationFrameRef.current = requestAnimationFrame(render)

    } catch (error: any) {
      console.error('MindAR initialization error:', error)
      isInitializing.current = false
      setIsLoading(false)
      
      if (error.name === 'NotAllowedError') {
        setHasPermission(false)
        setErrorMessage('Camera access was denied. Please allow camera access to use AR try-on.')
      } else if (error.name === 'NotFoundError') {
        setErrorMessage('No camera found. Please connect a camera to use AR try-on.')
      } else {
        setErrorMessage(`Failed to initialize AR: ${error.message || 'Unknown error'}. Please try again.`)
      }
    }
  }, [product])

  // Cleanup function - thorough cleanup to prevent WebGL context issues
  const stopAR = useCallback(() => {
    console.log('Stopping AR session...')
    
    // Stop animation loop first
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Stop MindAR and clean up resources
    if (mindarRef.current) {
      try {
        mindarRef.current.stop()
        
        // Clean up Three.js resources
        const { renderer, scene } = mindarRef.current
        if (scene) {
          scene.traverse((object: any) => {
            if (object.geometry) {
              object.geometry.dispose()
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((mat: any) => mat.dispose())
              } else {
                object.material.dispose()
              }
            }
          })
        }
        if (renderer) {
          renderer.dispose()
          renderer.forceContextLoss()
        }
      } catch (e) {
        console.warn('Error during AR cleanup:', e)
      }
      mindarRef.current = null
    }
    
    setIsARActive(false)
    isInitializing.current = false
  }, [])

  // Initialize AR on mount with delay for container to be ready
  useEffect(() => {
    if (product && containerRef.current) {
      // Small delay to ensure container is properly sized
      const timer = setTimeout(() => {
        initMindAR()
      }, 200)
      return () => {
        clearTimeout(timer)
        stopAR()
      }
    }
    return () => {
      stopAR()
    }
  }, [product, initMindAR, stopAR])

  // Capture screenshot
  const captureScreenshot = useCallback(() => {
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas')
      if (canvas) {
        const dataURL = canvas.toDataURL('image/png')
        setCapturedImage(dataURL)
        setIsCaptured(true)
      }
    }
  }, [])

  // Download captured image
  const downloadCapture = useCallback(() => {
    if (capturedImage) {
      const link = document.createElement('a')
      link.download = `nexus-ar-tryon-${Date.now()}.png`
      link.href = capturedImage
      link.click()
    }
  }, [capturedImage])

  // Dismiss captured image
  const dismissCapture = useCallback(() => {
    setIsCaptured(false)
    setCapturedImage(null)
  }, [])

  // Retry camera permission
  const retryPermission = useCallback(() => {
    setHasPermission(null)
    setErrorMessage(null)
    initMindAR()
  }, [initMindAR])

  if (!product) {
    return (
      <main className="main-content ar-tryon-page">
        <div className="ar-not-found">
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
    <main className="main-content ar-tryon-page">
      {/* Header */}
      <header className="ar-header">
        <motion.button 
          className="back-button"
          onClick={() => navigate(`/product/${productId}`)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </motion.button>
        
        <motion.h1 
          className="ar-title"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          Try On: <span className="accent">{product.name}</span>
        </motion.h1>

        <div className="ar-header-spacer" />
      </header>

      {/* AR Container */}
      <div className="ar-container">
        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              className="ar-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
              </div>
              <p>Initializing AR Camera...</p>
              <span className="loading-hint">Please allow camera access when prompted</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {errorMessage && (
          <motion.div 
            className="ar-error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p>{errorMessage}</p>
            {hasPermission === false && (
              <button onClick={retryPermission} className="retry-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Try Again
              </button>
            )}
            <button onClick={() => navigate(`/product/${productId}`)} className="back-btn">
              Return to Product
            </button>
          </motion.div>
        )}

        {/* MindAR Container */}
        <div 
          ref={containerRef} 
          className={`mindar-container ${isARActive ? 'active' : ''}`}
        />

        {/* Captured Image Preview */}
        <AnimatePresence>
          {isCaptured && capturedImage && (
            <motion.div 
              className="capture-preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <img src={capturedImage} alt="AR Try-On Capture" />
              <div className="capture-actions">
                <button onClick={downloadCapture} className="download-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </button>
                <button onClick={dismissCapture} className="dismiss-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AR Controls */}
        {isARActive && !errorMessage && (
          <motion.div 
            className="ar-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button 
              className="control-btn capture-btn" 
              onClick={captureScreenshot}
              aria-label="Capture photo"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>Capture</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Tips Section */}
      <motion.div 
        className="ar-tips"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3>Tips for best results</h3>
        <ul>
          <li>
            <span className="tip-icon">💡</span>
            Ensure good lighting on your face
          </li>
          <li>
            <span className="tip-icon">📱</span>
            Hold your device at eye level
          </li>
          <li>
            <span className="tip-icon">👤</span>
            Look directly at the camera
          </li>
          <li>
            <span className="tip-icon">🖼️</span>
            Keep a neutral background
          </li>
        </ul>
      </motion.div>
    </main>
  )
}

export default ARTryOnPage

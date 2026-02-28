import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FaceMesh } from '@mediapipe/face_mesh'
import './ARTryOnPage.scss'

// AR config per product — just a scale tweak if a particular model needs it
const defaultArConfig = {
  scale: 1.0,       // Overall size multiplier (1.0 = auto from PD)
  offsetY: 0.0,     // Vertical pixel offset (positive = down)
}

const productData: Record<string, {
  id: string
  name: string
  modelPath: string
  arConfig: typeof defaultArConfig
}> = {
  'glasses1':    { id: 'glasses1',    name: 'Aviator Elite',       modelPath: '/models/glasses1.glb',    arConfig: { ...defaultArConfig } },
  'glasses3':    { id: 'glasses3',    name: 'Pilot Classic',       modelPath: '/models/glasses3.glb',    arConfig: { ...defaultArConfig } },
  'glasses4':    { id: 'glasses4',    name: 'Executive',           modelPath: '/models/glasses4.glb',    arConfig: { ...defaultArConfig } },
  'glasses5':    { id: 'glasses5',    name: 'Heritage Round',      modelPath: '/models/glasses5.glb',    arConfig: { ...defaultArConfig } },
  'glasses6':    { id: 'glasses6',    name: 'Sport Precision',     modelPath: '/models/glasses6.glb',    arConfig: { ...defaultArConfig } },
  'glasses-1-':  { id: 'glasses-1-',  name: 'Signature One',       modelPath: '/models/glasses-1-.glb', arConfig: { ...defaultArConfig } },
  'glasses-5b':  { id: 'glasses-5b',  name: 'Active Sport',        modelPath: '/models/glasses-5b.glb', arConfig: { ...defaultArConfig } },
  'glasses-5c':  { id: 'glasses-5c',  name: 'Runner Pro',          modelPath: '/models/glasses-5c.glb', arConfig: { ...defaultArConfig } },
  'glasses-6':   { id: 'glasses-6',   name: 'Shield Sport',        modelPath: '/models/glasses-6.glb',  arConfig: { ...defaultArConfig } },
  'glasses-7':   { id: 'glasses-7',   name: 'Square Frame',        modelPath: '/models/glasses-7.glb',  arConfig: { ...defaultArConfig } },
  'glasses-7b':  { id: 'glasses-7b',  name: 'Luxury Wayfarer',     modelPath: '/models/glasses-7b.glb', arConfig: { ...defaultArConfig } },
  'glasses-7c':  { id: 'glasses-7c',  name: 'Designer Cat Eye',    modelPath: '/models/glasses-7c.glb', arConfig: { ...defaultArConfig } },
  'glasses-8b':  { id: 'glasses-8b',  name: 'Metropolitan',        modelPath: '/models/glasses-8b.glb', arConfig: { ...defaultArConfig } },
  'glasses-8c':  { id: 'glasses-8c',  name: 'Artisan Classic',     modelPath: '/models/glasses-8c.glb', arConfig: { ...defaultArConfig } },
  'glasses-9b':  { id: 'glasses-9b',  name: 'Urban Shield',        modelPath: '/models/glasses-9b.glb', arConfig: { ...defaultArConfig } },
  'glasses-9c':  { id: 'glasses-9c',  name: 'Vintage Square',      modelPath: '/models/glasses-9c.glb', arConfig: { ...defaultArConfig } },
  'glasses-10':  { id: 'glasses-10',  name: 'Oval Luxe',           modelPath: '/models/glasses-10.glb', arConfig: { ...defaultArConfig } },
  'glasses-11b': { id: 'glasses-11b', name: 'Edge Series B',       modelPath: '/models/glasses-11b.glb',arConfig: { ...defaultArConfig } },
  'glasses-11c': { id: 'glasses-11c', name: 'Bold Series C',       modelPath: '/models/glasses-11c.glb',arConfig: { ...defaultArConfig } },
  'glasses-12':  { id: 'glasses-12',  name: 'Heritage Gold',       modelPath: '/models/glasses-12.glb', arConfig: { ...defaultArConfig } },
  'sunglass':    { id: 'sunglass',    name: 'Classic Sunglass',    modelPath: '/models/sunglass.glb',   arConfig: { ...defaultArConfig } },
  'sunglasses':  { id: 'sunglasses',  name: 'Premium Sunglasses',  modelPath: '/models/sunglasses.glb', arConfig: { ...defaultArConfig } },
}

const ARTryOnPage = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const faceMeshRef = useRef<FaceMesh | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraThreeRef = useRef<THREE.OrthographicCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const glassesRef = useRef<THREE.Group | null>(null)
  const isInitializing = useRef(false)
  const modelSizeRef = useRef({ width: 1, height: 1, depth: 1 })
  
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isARActive, setIsARActive] = useState(false)
  const [isCaptured, setIsCaptured] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)

  const product = productId ? productData[productId] : null

  const initMediapipeAR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !product || isInitializing.current) return
    isInitializing.current = true

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const video = videoRef.current
      const canvas = canvasRef.current
      const canvasCtx = canvas.getContext('2d', { willReadFrequently: true })!

      // Initialize camera stream directly
      try {
        console.log('Requesting camera access...')
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        })
        
        console.log('Camera access granted')
        
        // Attach stream to video element
        video.srcObject = stream
        
        // Wait for video to load metadata
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            console.log('Video metadata loaded:', video.videoWidth, 'x', video.videoHeight)
            resolve()
          }
        })
        
        await video.play()
        console.log('Video playing')
        
        setHasPermission(true)
      } catch (camError: any) {
        console.error('Camera error:', camError)
        isInitializing.current = false
        setIsLoading(false)
        if (camError.name === 'NotAllowedError') {
          setHasPermission(false)
          setErrorMessage('Camera access denied. Please allow camera access.')
        } else if (camError.name === 'NotFoundError') {
          setErrorMessage('No camera found.')
        } else {
          setErrorMessage('Cannot access camera: ' + camError.message)
        }
        return
      }
      
      // Set canvas size to match the actual video feed resolution.
      // This guarantees a 1:1 mapping between MediaPipe normalised landmarks
      // and the pixel grid we draw on — no stretching artefacts.
      canvas.width  = video.videoWidth  || 1280
      canvas.height = video.videoHeight || 720

      console.log('Canvas size:', canvas.width, 'x', canvas.height)

      // ── Three.js setup — ORTHOGRAPHIC camera in screen-pixel space ──────────
      // This maps 1 Three.js unit = 1 canvas pixel. No FOV calibration needed.
      // Origin (0,0) = centre of canvas.  +x right, +y up.
      const halfW = canvas.width / 2
      const halfH = canvas.height / 2
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // near/far must accommodate the model after scaling.  A glasses model
      // in metres (width≈0.14) scaled to ~120 px becomes ~900× scale; its depth
      // expands to dozens of units.  Placing the camera at z=500 keeps the
      // entire model in front of the near plane no matter how large the scale.
      const orthoCamera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 1, 2000)
      orthoCamera.position.set(0, 0, 500)
      orthoCamera.lookAt(0, 0, 0)
      cameraThreeRef.current = orthoCamera

      const threeCanvas = document.createElement('canvas')
      threeCanvas.width = canvas.width
      threeCanvas.height = canvas.height

      const renderer = new THREE.WebGLRenderer({
        canvas: threeCanvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      })
      renderer.setSize(canvas.width, canvas.height)
      renderer.setPixelRatio(1)          // 1:1 pixel mapping for orthographic
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.setClearColor(0x000000, 0)
      rendererRef.current = renderer

      // Lighting — balanced so glasses look natural without washing out lenses
      scene.add(new THREE.AmbientLight(0xffffff, 0.9))
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
      dirLight.position.set(0, 1, 2)
      scene.add(dirLight)
      // Gentle fill light from behind to soften shadows
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.25)
      fillLight.position.set(0, 0, -2)
      scene.add(fillLight)

      // ── Load glasses model ──────────────────────────────────────────────────
      const loader = new GLTFLoader()
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(product.modelPath, resolve, undefined, reject)
      })

      const glassesModel = gltf.scene
      const box = new THREE.Box3().setFromObject(glassesModel)
      const size = box.getSize(new THREE.Vector3())
      const center = new THREE.Vector3()
      box.getCenter(center)

      // Store model's native width (used to compute pixel-based scale factor)
      modelSizeRef.current = { width: size.x, height: size.y, depth: size.z }
      console.log('[AR] Model bounding box — width:', size.x.toFixed(4),
        'height:', size.y.toFixed(4), 'depth:', size.z.toFixed(4))

      // Centre model at local (0,0,0) — the geometric centre of the frame
      // aligns with the nose bridge landmark when positioned in the scene.
      glassesModel.position.set(-center.x, -center.y, -center.z)

      glassesModel.traverse((child: any) => {
        if (child.isMesh) {
          child.frustumCulled = false
          if (child.material) {
            // Clone material so we don't mutate shared instances
            child.material = child.material.clone()
            child.material.needsUpdate = true
            child.material.side = THREE.DoubleSide

            // Detect lens meshes: they're typically transparent, have high
            // transmission, or very low opacity. Preserve their look.
            const mat = child.material
            const isLens = mat.transparent ||
                           (mat.opacity !== undefined && mat.opacity < 0.95) ||
                           (mat.transmission !== undefined && mat.transmission > 0.1)

            if (isLens) {
              // Preserve the original lens tint / transparency.
              // Ensure lenses are actually transparent so they don't go opaque white.
              mat.transparent = true
              if (mat.opacity === undefined || mat.opacity >= 1) mat.opacity = 0.4
              mat.depthWrite = false
              // Keep original metalness/roughness for glass look
            } else {
              // Frame / temple material — gentle cap so it doesn't blow out
              if (mat.metalness !== undefined) {
                mat.metalness = Math.min(mat.metalness, 0.6)
                mat.roughness = Math.max(mat.roughness, 0.25)
              }
            }
          }
        }
      })

      // ── Orient towards camera & mirror for selfie view ────────────────────────
      // These models are built facing -Z (backwards). The camera is at +Z.
      // 1. Rotate 180° around Y so the front of the glasses faces the camera.
      glassesModel.rotation.y = Math.PI

      // 2. The video feed is drawn mirrored (selfie mode). We must also mirror
      // the geometry on the X-axis so it matches the left↔right swap.
      // We flip vertex positions + normals and reverse winding to keep lighting
      // correct (avoids the white-lens artefact caused by negative scale).
      glassesModel.traverse((child: any) => {
        if (child.isMesh && child.geometry) {
          // Flip geometry on X-axis to mirror for selfie view.
          // This avoids negative scale which inverts triangle winding / normals.
          child.geometry = child.geometry.clone()
          const pos = child.geometry.attributes.position
          if (pos) {
            for (let i = 0; i < pos.count; i++) {
              pos.setX(i, -pos.getX(i))
            }
            pos.needsUpdate = true
          }
          // Flip normals X component to keep lighting correct
          const norm = child.geometry.attributes.normal
          if (norm) {
            for (let i = 0; i < norm.count; i++) {
              norm.setX(i, -norm.getX(i))
            }
            norm.needsUpdate = true
          }
          // Reverse face winding so front faces stay front after X-flip
          if (child.geometry.index) {
            const idx = child.geometry.index.array
            for (let i = 0; i < idx.length; i += 3) {
              const tmp = idx[i]
              idx[i] = idx[i + 2]
              idx[i + 2] = tmp
            }
            child.geometry.index.needsUpdate = true
          }
          child.geometry.computeBoundingBox()
          child.geometry.computeBoundingSphere()
        }
      })

      const glassesGroup = new THREE.Group()
      glassesGroup.add(glassesModel)
      glassesGroup.visible = false
      scene.add(glassesGroup)
      glassesRef.current = glassesGroup

      // ── MediaPipe Face Mesh ──────────────────────────────────────────────────
      console.log('Initializing MediaPipe Face Mesh...')
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          const url = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
          console.log('Loading MediaPipe file:', url)
          return url
        }
      })
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,          // enables iris landmarks 468-477
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      let isProcessing = false

      // ── Per-frame callback ──────────────────────────────────────────────────
      faceMesh.onResults((results) => {
        // Draw mirrored video (selfie view)
        canvasCtx.save()
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
        canvasCtx.translate(canvas.width, 0)
        canvasCtx.scale(-1, 1)
        canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
        canvasCtx.restore()

        if (!results.multiFaceLandmarks?.[0] || !glassesRef.current) {
          if (glassesRef.current) glassesRef.current.visible = false
          setFaceDetected(false)
          isProcessing = false
          return
        }
        setFaceDetected(true)
        const lm = results.multiFaceLandmarks[0]

        // ── Key landmarks (all in MediaPipe normalised 0-1 coords) ───────────
        // Iris centres (from refineLandmarks):  468 left, 473 right
        // Eye outer corners: 33 left, 263 right
        // Nose bridge: 168
        const noseBridge  = lm[168]
        const leftPupil   = lm[468] ?? lm[33]    // fallback
        const rightPupil  = lm[473] ?? lm[263]
        const leftOuter   = lm[33]
        const rightOuter  = lm[263]

        // ── Convert to mirrored pixel coords ─────────────────────────────────
        // Mirror: px = (1 - norm.x) * W      py = norm.y * H
        const W = canvas.width
        const H = canvas.height
        const nb  = { x: (1 - noseBridge.x)  * W, y: noseBridge.y  * H }
        const lp  = { x: (1 - leftPupil.x)   * W, y: leftPupil.y   * H }
        const rp  = { x: (1 - rightPupil.x)  * W, y: rightPupil.y  * H }
        const lo  = { x: (1 - leftOuter.x)   * W, y: leftOuter.y   * H }
        const ro  = { x: (1 - rightOuter.x)  * W, y: rightOuter.y  * H }

        // ── Pupillary Distance in pixels (Euclidean) ─────────────────────────
        const PD = Math.hypot(rp.x - lp.x, rp.y - lp.y)

        // ── Target glasses width in pixels ───────────────────────────────────
        // Real glasses are roughly 2.1 × PD.  Fine-tune per product with arConfig.scale.
        const glassesWidthPx = PD * 2.1 * product.arConfig.scale

        // Scale factor: how many pixels per model unit
        const scaleFactor = glassesWidthPx / modelSizeRef.current.width

        // Debug: log once on first detection
        if (!glassesRef.current!.visible) {
          console.log('[AR] PD px:', PD.toFixed(1),
            '| target width px:', glassesWidthPx.toFixed(1),
            '| model native width:', modelSizeRef.current.width.toFixed(4),
            '| scaleFactor:', scaleFactor.toFixed(2))
        }

        // ── Position in Three.js orthographic coords ─────────────────────────
        // Ortho camera: centre of canvas = (0,0),  +x right,  +y UP
        const posX = nb.x - halfW
        const posY = -(nb.y - halfH) + product.arConfig.offsetY  // flip y (screen y → 3D y)

        // ── Head roll from eye outer corners ─────────────────────────────────
        const roll = -Math.atan2(ro.y - lo.y, ro.x - lo.x)

        // ── Apply with lerp smoothing (0.35 = smooth, 0.6 = responsive) ─────
        const LERP = 0.4
        const tPos = new THREE.Vector3(posX, posY, 0)
        const tScale = new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor)

        if (!glassesRef.current.visible) {
          glassesRef.current.visible = true
          glassesRef.current.position.copy(tPos)
          glassesRef.current.scale.copy(tScale)
          glassesRef.current.rotation.z = roll
        } else {
          glassesRef.current.position.lerp(tPos, LERP)
          glassesRef.current.scale.lerp(tScale, LERP)
          glassesRef.current.rotation.z += (roll - glassesRef.current.rotation.z) * LERP
        }

        // ── Render Three.js and composite over video ─────────────────────────
        if (rendererRef.current && sceneRef.current && cameraThreeRef.current) {
          rendererRef.current.render(sceneRef.current, cameraThreeRef.current)
          canvasCtx.drawImage(threeCanvas, 0, 0)
        }
        isProcessing = false
      })

      faceMeshRef.current = faceMesh

      // Manual frame processing loop (more reliable than Camera utility)
      const processFrame = async () => {
        if (!faceMeshRef.current || !video || video.readyState < 2) {
          requestAnimationFrame(processFrame)
          return
        }

        if (!isProcessing) {
          isProcessing = true
          try {
            await faceMeshRef.current.send({ image: video })
          } catch (error) {
            console.error('MediaPipe processing error:', error)
            isProcessing = false
          }
        }
        
        requestAnimationFrame(processFrame)
      }

      // Wait for video to be ready
      if (video.readyState >= 2) {
        processFrame()
      } else {
        video.addEventListener('loadeddata', () => {
          processFrame()
        }, { once: true })
      }
      
      console.log('MediaPipe Face Mesh initialized successfully')

      setIsARActive(true)
      setIsLoading(false)
      isInitializing.current = false

    } catch (error: any) {
      console.error('AR initialization error:', error)
      isInitializing.current = false
      setIsLoading(false)
      
      // Provide more specific error messages
      if (error.message?.includes('camera')) {
        setErrorMessage('Camera initialization failed. Please refresh the page and try again.')
      } else if (error.message?.includes('model') || error.message?.includes('load')) {
        setErrorMessage('Failed to load AR models. Please check your internet connection.')
      } else {
        setErrorMessage(`Failed to initialize AR: ${error.message || 'Unknown error'}`)
      }
    }
  }, [product])

  const stopAR = useCallback(() => {
    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    if (faceMeshRef.current) {
      faceMeshRef.current.close()
      faceMeshRef.current = null
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }

    if (sceneRef.current) {
      sceneRef.current.clear()
      sceneRef.current = null
    }
    
    setIsARActive(false)
    isInitializing.current = false
  }, [])

  useEffect(() => {
    if (product) {
      initMediapipeAR()
    }
    return () => stopAR()
  }, [product, initMediapipeAR, stopAR])

  const captureScreenshot = useCallback(() => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL('image/png')
      setCapturedImage(dataURL)
      setIsCaptured(true)
    }
  }, [])

  const downloadCapture = useCallback(() => {
    if (capturedImage) {
      const link = document.createElement('a')
      link.download = `ar-tryon-${Date.now()}.png`
      link.href = capturedImage
      link.click()
    }
  }, [capturedImage])

  const dismissCapture = useCallback(() => {
    setIsCaptured(false)
    setCapturedImage(null)
  }, [])

  const retryPermission = useCallback(() => {
    setHasPermission(null)
    setErrorMessage(null)
    initMediapipeAR()
  }, [initMediapipeAR])

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

      <div className="ar-container" ref={containerRef}>
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
              <span className="loading-hint">Please allow camera access</span>
            </motion.div>
          )}
        </AnimatePresence>

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
                Try Again
              </button>
            )}
            <button onClick={() => navigate(`/product/${productId}`)} className="back-btn">
              Return to Product
            </button>
          </motion.div>
        )}

        <div className="ar-video-container">
          <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
          <canvas ref={canvasRef} className={`ar-canvas ${isARActive ? 'active' : ''}`} />
          
          {/* Face tracking indicator */}
          {isARActive && !errorMessage && (
            <motion.div 
              className={`face-tracking-indicator ${faceDetected ? 'detected' : 'searching'}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="indicator-dot"></div>
              <span>{faceDetected ? 'Face Tracked' : 'Looking for face...'}</span>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {isCaptured && capturedImage && (
            <motion.div 
              className="capture-preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <img src={capturedImage} alt="AR Capture" />
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

      <motion.div 
        className="ar-tips"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3>Tips for best results</h3>
        <ul>
          <li><span className="tip-icon">💡</span>Ensure good lighting on your face</li>
          <li><span className="tip-icon">📱</span>Hold your device at eye level</li>
          <li><span className="tip-icon">👤</span>Look directly at the camera</li>
          <li><span className="tip-icon">🖼️</span>Keep a neutral background</li>
        </ul>
      </motion.div>
    </main>
  )
}

export default ARTryOnPage

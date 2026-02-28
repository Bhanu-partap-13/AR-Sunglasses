import { useState, useRef, useCallback, Suspense, useMemo, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Html, useProgress, Center, Float } from '@react-three/drei'
import * as THREE from 'three'
import './Customizer.scss'

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

// Frame color options
const frameColors = [
  { name: 'Matte Black', color: '#1A1A1A', metalness: 0, roughness: 0.9 },
  { name: 'Polished Gold', color: '#D4AF37', metalness: 1, roughness: 0.1 },
  { name: 'Rose Gold', color: '#B76E79', metalness: 1, roughness: 0.15 },
  { name: 'Silver', color: '#C0C0C0', metalness: 1, roughness: 0.2 },
  { name: 'Tortoiseshell', color: '#8B4513', metalness: 0.2, roughness: 0.6 },
  { name: 'Champagne', color: '#F4CF67', metalness: 0.9, roughness: 0.15 },
]

// Lens tint options
const lensTints = [
  { name: 'Gradient Blue', color: '#1E3A8A', gradient: true },
  { name: 'Brown', color: '#92400E', gradient: false },
  { name: 'Gray', color: '#374151', gradient: false },
  { name: 'Green', color: '#065F46', gradient: true },
  { name: 'Mirror Gold', color: '#D4AF37', gradient: false, mirror: true },
  { name: 'Mirror Silver', color: '#C0C0C0', gradient: false, mirror: true },
]

// Environment options
const environments = [
  { name: 'Studio', preset: 'studio' },
  { name: 'Sunset', preset: 'sunset' },
  { name: 'City', preset: 'city' },
  { name: 'Forest', preset: 'forest' },
  { name: 'Night', preset: 'night' },
]

// Designer preset combinations
const designerPresets = [
  { 
    name: 'Golden Hour',
    frame: 0, // Matte Black
    lens: 0,  // Gradient Blue
    env: 1,   // Sunset
  },
  { 
    name: 'Executive',
    frame: 1, // Polished Gold
    lens: 2,  // Gray
    env: 2,   // City
  },
  { 
    name: 'Vintage Glamour',
    frame: 4, // Tortoiseshell
    lens: 1,  // Brown
    env: 0,   // Studio
  },
  { 
    name: 'Modern Minimalist',
    frame: 3, // Silver
    lens: 4,  // Mirror Gold
    env: 2,   // City
  },
]

// Customizable Sunglasses Model
const CustomizableGlasses = ({ 
  modelPath, 
  frameColor, 
  lensConfig,
  lensTransparency,
  modelRef 
}: { 
  modelPath: string
  frameColor: typeof frameColors[0]
  lensConfig: typeof lensTints[0]
  lensTransparency: number
  modelRef: any
}) => {
  const { scene } = useGLTF(modelPath)
  
  // Clone and configure the scene with useMemo for performance
  const configuredScene = useMemo(() => {
    const clonedScene = scene.clone()
    
    // Calculate bounding box to center and scale the model
    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = box.getSize(new THREE.Vector3())
    
    // Get the largest dimension
    const maxDim = Math.max(size.x, size.y, size.z)
    // Scale to fit nicely (target size ~2 units)
    const scale = 2 / maxDim
    
    clonedScene.scale.setScalar(scale)
    
    // Recalculate center after scaling and center the model
    const newBox = new THREE.Box3().setFromObject(clonedScene)
    const newCenter = newBox.getCenter(new THREE.Vector3())
    clonedScene.position.sub(newCenter)

    // Apply materials to the model
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        // Enable shadows
        child.castShadow = true
        child.receiveShadow = true
        
        const meshName = child.name.toLowerCase()
        const isLens = meshName.includes('lens') || meshName.includes('glass')
        
        // Lens material
        if (isLens) {
          if (lensConfig.mirror) {
            child.material = new THREE.MeshStandardMaterial({
              color: lensConfig.color,
              metalness: 1,
              roughness: 0.05,
              envMapIntensity: 2,
              side: THREE.DoubleSide,
            })
          } else {
            child.material = new THREE.MeshPhysicalMaterial({
              color: lensConfig.color,
              attenuationColor: lensConfig.color, // Crucial for tinting light passing through
              attenuationDistance: 2.0, // Controls how quickly the tint applies
              metalness: 0.1,
              roughness: 0.05,
              transmission: lensTransparency,
              thickness: 1.5, // More thickness to simulate real glass
              opacity: 1, // Keep fully opaque to make transmission work correctly
              transparent: true,
              side: THREE.DoubleSide, // Essential so lenses aren't invisible from back
              depthWrite: false, // Prevents Z-fighting issues with transparent objects
              envMapIntensity: 1.5, // Brings back natural reflections
              clearcoat: 1.0, // Adds high-gloss finish
              clearcoatRoughness: 0.1
            })
          }
        } else {
          // Frame material - apply to all non-lens meshes
          child.material = new THREE.MeshStandardMaterial({
            color: frameColor.color,
            metalness: frameColor.metalness,
            roughness: frameColor.roughness,
          })
        }
      }
    })
    
    return clonedScene
  }, [scene, frameColor, lensConfig, lensTransparency])

  return (
    <Center>
      <Float 
        speed={1.5} 
        rotationIntensity={0.2} 
        floatIntensity={0.3}
      >
        <primitive ref={modelRef} object={configuredScene} />
      </Float>
    </Center>
  )
}

// Screenshot handler component that exposes the takeScreenshot function
const ScreenshotHandler = ({ onReady }: { onReady: (fn: () => void) => void }) => {
  const { gl, scene, camera } = useThree()
  
  const takeScreenshot = useCallback(() => {
    gl.render(scene, camera)
    const dataURL = gl.domElement.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `nexus-optics-custom-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }, [gl, scene, camera])

  // Register the screenshot function when component mounts
  useEffect(() => {
    onReady(takeScreenshot)
  }, [takeScreenshot, onReady])

  return null
}

const Customizer: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('/models/glasses1.glb')
  const [selectedFrame, setSelectedFrame] = useState(0)
  const [selectedLens, setSelectedLens] = useState(4) // Mirror Gold default (index 4)
  const [selectedEnv, setSelectedEnv] = useState(3) // Forest default (index 3)
  const [lensTransparency, setLensTransparency] = useState(0.7)
  const modelRef = useRef()
  const screenshotRef = useRef<(() => void) | null>(null)

  const handlePresetSelect = (preset: typeof designerPresets[0]) => {
    setSelectedFrame(preset.frame)
    setSelectedLens(preset.lens)
    setSelectedEnv(preset.env)
  }

  const handleScreenshotReady = useCallback((fn: () => void) => {
    screenshotRef.current = fn
  }, [])

  const handleCaptureClick = useCallback(() => {
    if (screenshotRef.current) {
      screenshotRef.current()
    }
  }, [])

  const models = [
    '/models/glasses1.glb',
    '/models/glasses-9b.glb',
    '/models/glasses-11b.glb',
  ]

  return (
    <section id="customize" className="customize-section">
      <div className="customize-container">
        <div className="customize-header">
          <span className="section-label">Customization</span>
          <h2 className="section-title">
            Design Your <span className="accent">Masterpiece</span>
          </h2>
          <p className="section-description">
            Create your perfect pair with our advanced 3D customization tool
          </p>
        </div>

        <div className="customize-workspace">
          {/* 3D Viewer */}
          <div className="viewer-container">
            <Canvas 
              shadows 
              dpr={[1, 2]}
              performance={{ min: 0.5 }}
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
                minDistance={0.1}
                maxDistance={100}
                enablePan={true}
                enableDamping
                dampingFactor={0.05}
                target={[0, 0, 0]}
                zoomSpeed={1.2}
              />
              
              {/* Main Lighting Setup - Top-down studio lighting */}
              <ambientLight intensity={0.6} />
              
              {/* Key Light - from directly above for dramatic top lighting */}
              <directionalLight 
                position={[0, 12, 2]} 
                intensity={2.0}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              
              {/* Secondary Top Light - slightly angled for depth */}
              <directionalLight 
                position={[3, 10, 3]} 
                intensity={1.2}
              />
              
              {/* Fill Light - softer, from sides */}
              <directionalLight 
                position={[-4, 6, 4]} 
                intensity={0.5}
              />
              
              {/* Subtle bottom fill to prevent too dark shadows */}
              <pointLight 
                position={[0, -3, 3]} 
                intensity={0.3} 
                color="#ffffff"
              />
              
              {/* Gold Accent Light from top */}
              <spotLight 
                position={[0, 15, 0]} 
                angle={0.6} 
                penumbra={0.8} 
                intensity={0.8}
                color="#FFF8E7"
              />
              
              <Suspense fallback={<Loader />}>
                {/* Environment moved inside Suspense to prevent layout jumps when loading new HDRIs */}
                <Environment 
                  preset={environments[selectedEnv].preset as any} 
                  background={true} 
                  blur={0.2} // Slight blur keeps focus on glasses while clearly showing the environment
                />
                
                {/* Shadow receiving plane */}
                <mesh 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  position={[0, -1.5, 0]} 
                  receiveShadow
                >
                  <planeGeometry args={[20, 20]} />
                  <shadowMaterial opacity={0.15} />
                </mesh>
                
                <CustomizableGlasses 
                  modelPath={selectedModel}
                  frameColor={frameColors[selectedFrame]}
                  lensConfig={lensTints[selectedLens]}
                  lensTransparency={lensTransparency}
                  modelRef={modelRef}
                />
              </Suspense>
              
              {/* Screenshot handler - invisible, just registers the function */}
              <ScreenshotHandler onReady={handleScreenshotReady} />
            </Canvas>
          </div>
          
          {/* Screenshot button outside canvas */}
          <button className="screenshot-btn-external" onClick={handleCaptureClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>Capture Design</span>
          </button>

          {/* Control Panel */}
          <div className="control-panel" data-lenis-prevent>
            {/* Model Selection */}
            <div className="control-group">
              <h3 className="control-title">Select Model</h3>
              <div className="model-grid">
                {models.map((model, idx) => (
                  <button
                    key={idx}
                    className={`model-btn ${selectedModel === model ? 'active' : ''}`}
                    onClick={() => setSelectedModel(model)}
                  >
                    <span>Model {idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Color */}
            <div className="control-group">
              <h3 className="control-title">Frame Color</h3>
              <div className="color-grid">
                {frameColors.map((frame, idx) => (
                  <button
                    key={idx}
                    className={`color-btn ${selectedFrame === idx ? 'active' : ''}`}
                    onClick={() => setSelectedFrame(idx)}
                    style={{ '--color': frame.color } as React.CSSProperties}
                  >
                    <span className="color-swatch" style={{ backgroundColor: frame.color }}></span>
                    <span className="color-name">{frame.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lens Tint */}
            <div className="control-group">
              <h3 className="control-title">Lens Tint</h3>
              <div className="color-grid">
                {lensTints.map((lens, idx) => (
                  <button
                    key={idx}
                    className={`color-btn ${selectedLens === idx ? 'active' : ''}`}
                    onClick={() => setSelectedLens(idx)}
                  >
                    <span className="color-swatch" style={{ backgroundColor: lens.color }}></span>
                    <span className="color-name">{lens.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transparency Slider */}
            <div className="control-group">
              <h3 className="control-title">Lens Transparency</h3>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={lensTransparency}
                onChange={(e) => setLensTransparency(parseFloat(e.target.value))}
                className="transparency-slider"
              />
              <span className="slider-value">{Math.round(lensTransparency * 100)}%</span>
            </div>

            {/* Environment */}
            <div className="control-group">
              <h3 className="control-title">Environment</h3>
              <div className="env-grid">
                {environments.map((env, idx) => (
                  <button
                    key={idx}
                    className={`env-btn ${selectedEnv === idx ? 'active' : ''}`}
                    onClick={() => setSelectedEnv(idx)}
                  >
                    {env.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Designer Presets */}
            <div className="control-group">
              <h3 className="control-title">Designer Picks</h3>
              <div className="preset-grid">
                {designerPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    className="preset-btn"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <span className="preset-icon">✨</span>
                    <span className="preset-name">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Customizer

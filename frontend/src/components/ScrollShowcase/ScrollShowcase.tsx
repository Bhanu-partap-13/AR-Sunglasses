import { useRef, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, PerspectiveCamera, Environment, Html, useProgress, OrbitControls } from '@react-three/drei'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import './ScrollShowcase.scss'

gsap.registerPlugin(ScrollTrigger)

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

// Sunglasses 3D Model Component
const SunglassesModel = ({ modelPath, animationRef }: { modelPath: string, animationRef: any }) => {
  const group = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelPath)
  
  useEffect(() => {
    if (group.current) {
      animationRef.current = group.current
    }
  }, [animationRef])

  return (
    <group ref={group}>
      <primitive object={scene.clone()} scale={2.0} />
    </group>
  )
}

// Preload model
useGLTF.preload('/models/glasses1.glb')

const ScrollShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!sectionRef.current || !modelRef.current) return

    const ctx = gsap.context(() => {
      // Scene 1: Initial rotation and zoom
      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=1000',
          scrub: 1,
          pin: true,
        }
      })
      .to(modelRef.current!.rotation, {
        y: Math.PI * 0.5,
        duration: 1,
        ease: 'power2.inOut'
      })
      .to(modelRef.current!.position, {
        z: -1,
        duration: 1,
        ease: 'power2.inOut'
      }, '<')

      // Scene 2: Exploded view
      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: '+=1000',
          end: '+=1000',
          scrub: 1,
          pin: true,
        }
      })
      .to(modelRef.current!.rotation, {
        y: Math.PI,
        x: Math.PI * 0.15,
        duration: 1,
        ease: 'power2.inOut'
      })
      .to(modelRef.current!.scale, {
        x: 3,
        y: 3,
        z: 3,
        duration: 1,
        ease: 'power2.inOut'
      }, '<')

      // Scene 3: Reassemble and final view
      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: '+=2000',
          end: '+=1000',
          scrub: 1,
          pin: true,
        }
      })
      .to(modelRef.current!.rotation, {
        y: Math.PI * 2,
        x: 0,
        duration: 1,
        ease: 'power2.inOut'
      })
      .to(modelRef.current!.scale, {
        x: 2.5,
        y: 2.5,
        z: 2.5,
        duration: 1,
        ease: 'power2.inOut'
      }, '<')
      .to(modelRef.current!.position, {
        z: 0,
        duration: 1,
        ease: 'power2.inOut'
      }, '<')
    })

    return () => ctx.revert()
  }, [])

  return (
    <section id="scroll-showcase" className="scroll-showcase-section" ref={sectionRef}>
      <div className="showcase-background">
        <div className="gradient-layer"></div>
      </div>

      <div className="showcase-content">
        <div className="content-overlay">
          <div className="text-content">
            <span className="section-label">Craftsmanship</span>
            <h2 className="section-title">
              Every Detail <span className="accent">Perfected</span>
            </h2>
            <p className="section-description">
              From precision-engineered hinges to hand-polished frames, 
              each element is crafted to exceed expectations.
            </p>
          </div>
        </div>

        <div className="canvas-container" ref={canvasRef}>
          <Canvas 
            shadows 
            dpr={[1, 1.5]}
            performance={{ min: 0.5 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
            <OrbitControls
              enableZoom
              minDistance={3}
              maxDistance={8}
              enablePan={false}
            />
            
            <ambientLight intensity={0.5} />
            <spotLight 
              position={[10, 10, 10]} 
              angle={0.3} 
              penumbra={1} 
              intensity={1.2}
              castShadow={false}
            />
            <pointLight position={[0, 5, 5]} intensity={0.4} color="#D4AF37" />
            
            <Environment preset="sunset" />
            
            <Suspense fallback={<Loader />}>
              <SunglassesModel 
                modelPath="/models/glasses1.glb" 
                animationRef={modelRef}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </section>
  )
}

export default ScrollShowcase

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform float uTime;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    // Calculate distance from mouse
    float dist = distance(uMouse, uv);
    float maxDist = 0.3;
    
    // Liquid distortion effect
    if (dist < maxDist) {
      float strength = (1.0 - dist / maxDist) * 0.15;
      
      // Create ripple effect
      float ripple = sin(dist * 20.0 - uTime * 3.0) * strength;
      
      // Apply distortion
      vec2 distortion = vec2(
        sin(uv.y * 10.0 + uTime) * ripple,
        cos(uv.x * 10.0 + uTime) * ripple
      );
      
      uv += distortion;
    }
    
    vec4 color = texture2D(uTexture, uv);
    gl_FragColor = color;
  }
`

export const HeroText3D: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const { viewport } = useThree()
  
  const uniforms = useMemo(
    () => ({
      uTexture: { value: createTextTexture() },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 }
    }),
    []
  )

  useFrame((state) => {
    if (!meshRef.current) return
    
    // Lerp mouse position for smooth trailing
    mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.08
    mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.08
    
    uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)
    uniforms.uTime.value = state.clock.elapsedTime
  })

  const handlePointerMove = (e: any) => {
    // Convert to UV coordinates
    targetMouseRef.current.x = (e.point.x / viewport.width + 0.5)
    targetMouseRef.current.y = (e.point.y / viewport.height + 0.5)
  }

  return (
    <mesh 
      ref={meshRef}
      onPointerMove={handlePointerMove}
      position={[0, 0, 0]}
    >
      <planeGeometry args={[8, 3, 32, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  )
}

function createTextTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 384
  const ctx = canvas.getContext('2d')!
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, 'rgba(197, 155, 42, 0.1)')
  gradient.addColorStop(1, 'rgba(166, 124, 0, 0.1)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw text
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 120px Playfair Display, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('WEAR THE TREND', canvas.width / 2, canvas.height / 2)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

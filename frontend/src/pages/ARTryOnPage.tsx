/**
 * ARTryOnPage — Complete rewrite
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  MIRROR APPROACH  (the correct way — used by Snap / TikTok filters) │
 * │                                                                     │
 * │  canvas CSS:  transform: scaleX(-1)                                 │
 * │                                                                     │
 * │  • MediaPipe receives the RAW (unflipped) video frame               │
 * │  • Landmarks come back in raw image coordinates  lm.x ∈ [0,1]      │
 * │  • We draw raw video to canvas  (NO ctx.scale(-1,1) flip)           │
 * │  • Three.js positions use raw  lm.x * W  (NO  1-lm.x  flip)        │
 * │  • CSS scaleX(-1) on the canvas mirrors video + glasses together    │
 * │    → temples always appear on the correct face side  ✓              │
 * │                                                                     │
 * │  GLB model: rotation.y = Math.PI only (faces camera). Zero geometry │
 * │  flipping required.                                                 │
 * └─────────────────────────────────────────────────────────────────────┘
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FaceMesh } from '@mediapipe/face_mesh'

// ─── Product registry ────────────────────────────────────────────────────────
const PRODUCTS: Record<string, { name: string; modelPath: string; offsetY: number; scale: number }> = {
  'glasses1':    { name: 'Aviator Elite',     modelPath: '/models/glasses1.glb',    offsetY: 0, scale: 1 },
  'glasses3':    { name: 'Pilot Classic',     modelPath: '/models/glasses3.glb',    offsetY: 0, scale: 1 },
  'glasses4':    { name: 'Executive',         modelPath: '/models/glasses4.glb',    offsetY: 0, scale: 1 },
  'glasses5':    { name: 'Heritage Round',    modelPath: '/models/glasses5.glb',    offsetY: 0, scale: 1 },
  'glasses6':    { name: 'Sport Precision',   modelPath: '/models/glasses6.glb',    offsetY: 0, scale: 1 },
  'glasses-1-':  { name: 'Signature One',     modelPath: '/models/glasses-1-.glb',  offsetY: 0, scale: 1 },
  'glasses-5b':  { name: 'Active Sport',      modelPath: '/models/glasses-5b.glb',  offsetY: 0, scale: 1 },
  'glasses-5c':  { name: 'Runner Pro',        modelPath: '/models/glasses-5c.glb',  offsetY: 0, scale: 1 },
  'glasses-6':   { name: 'Shield Sport',      modelPath: '/models/glasses-6.glb',   offsetY: 0, scale: 1 },
  'glasses-7':   { name: 'Square Frame',      modelPath: '/models/glasses-7.glb',   offsetY: 0, scale: 1 },
  'glasses-7b':  { name: 'Luxury Wayfarer',   modelPath: '/models/glasses-7b.glb',  offsetY: 0, scale: 1 },
  'glasses-7c':  { name: 'Designer Cat Eye',  modelPath: '/models/glasses-7c.glb',  offsetY: 0, scale: 1 },
  'glasses-8b':  { name: 'Metropolitan',      modelPath: '/models/glasses-8b.glb',  offsetY: 0, scale: 1 },
  'glasses-8c':  { name: 'Artisan Classic',   modelPath: '/models/glasses-8c.glb',  offsetY: 0, scale: 1 },
  'glasses-9b':  { name: 'Urban Shield',      modelPath: '/models/glasses-9b.glb',  offsetY: 0, scale: 1 },
  'glasses-9c':  { name: 'Vintage Square',    modelPath: '/models/glasses-9c.glb',  offsetY: 0, scale: 1 },
  'glasses-10':  { name: 'Oval Luxe',         modelPath: '/models/glasses-10.glb',  offsetY: 0, scale: 1 },
  'glasses-11b': { name: 'Edge Series B',     modelPath: '/models/glasses-11b.glb', offsetY: 0, scale: 1 },
  'glasses-11c': { name: 'Bold Series C',     modelPath: '/models/glasses-11c.glb', offsetY: 0, scale: 1 },
  'glasses-12':  { name: 'Heritage Gold',     modelPath: '/models/glasses-12.glb',  offsetY: 0, scale: 1 },
  'sunglass':    { name: 'Classic Sunglass',  modelPath: '/models/sunglass.glb',    offsetY: 0, scale: 1 },
  'sunglasses':  { name: 'Premium Sunglasses',modelPath: '/models/sunglasses.glb',  offsetY: 0, scale: 1 },
}

const SCAN_FRAMES = 45   // frames to collect before locking scale

// ─── Component ───────────────────────────────────────────────────────────────
export default function ARTryOnPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate      = useNavigate()
  const product       = productId ? PRODUCTS[productId] : null

  // DOM
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Three.js
  const sceneRef     = useRef<THREE.Scene | null>(null)
  const cameraRef    = useRef<THREE.OrthographicCamera | null>(null)
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const glassesRef   = useRef<THREE.Group | null>(null)
  const occluderRef  = useRef<THREE.Mesh | null>(null)   // depth-only face oval — occludes temple arms
  const modelWRef    = useRef(1)  // native model width in model units

  // MediaPipe / loop
  const faceMeshRef  = useRef<FaceMesh | null>(null)
  const initRef      = useRef(false)
  const busyRef      = useRef(false)

  // Calibration scan
  const scanBufRef  = useRef<{ ts: number; oe: number }[]>([])
  const calibRef    = useRef<number | null>(null)   // just a "ready" flag after scan completes
  const scaleRatioRef = useRef<number>(1)           // product.scale / modelW — pixel-span → scene units
  const phaseRef    = useRef<'scanning' | 'done'>('scanning')

  // UI
  const [status,    setStatus]    = useState<'loading' | 'scanning' | 'running' | 'error'>('loading')
  const [errMsg,    setErrMsg]    = useState<string | null>(null)
  const [denied,    setDenied]    = useState(false)
  const [scanPct,   setScanPct]   = useState(0)
  const [faceLive,  setFaceLive]  = useState(false)
  const [captured,  setCaptured]  = useState<string | null>(null)
  // User-controlled size multiplier (0.7 – 1.5, default 1.0)
  const [userScale, setUserScale] = useState(1.0)
  const userScaleRef = useRef(1.0)
  useEffect(() => { userScaleRef.current = userScale }, [userScale])

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  const stopAR = useCallback(() => {
    if (videoRef.current?.srcObject) {
      ;(videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    faceMeshRef.current?.close()
    faceMeshRef.current = null
    rendererRef.current?.dispose()
    rendererRef.current = null
    sceneRef.current?.clear()
    sceneRef.current = null
    glassesRef.current    = null
    occluderRef.current   = null
    initRef.current       = false
    busyRef.current       = false
    scanBufRef.current    = []
    calibRef.current      = null
    scaleRatioRef.current = 1
    phaseRef.current      = 'scanning'
  }, [])

  // ─── Init ─────────────────────────────────────────────────────────────────
  const initAR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !product || initRef.current) return
    initRef.current = true

    const video  = videoRef.current
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d', { willReadFrequently: true })!

    // ── Camera ────────────────────────────────────────────────────────────
    try {
      if (video.srcObject) {
        ;(video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
        video.srcObject = null
      }
      if (!navigator.mediaDevices?.getUserMedia)
        throw Object.assign(new Error('Camera API requires HTTPS or localhost'), { name: 'NotSupported' })

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      if (!containerRef.current) { stream.getTracks().forEach(t => t.stop()); return }

      video.srcObject = stream
      await new Promise<void>(res => { video.onloadedmetadata = () => res() })
      await video.play().catch(e => console.warn('[AR] play():', e))
    } catch (e: any) {
      console.error('[AR] camera:', e)
      initRef.current = false
      if (e.name === 'NotAllowedError') setDenied(true)
      setErrMsg(
        e.name === 'NotAllowedError' ? 'Camera access denied. Tap "Try Again" and allow camera.' :
        e.name === 'NotFoundError'   ? 'No camera found on this device.' :
        `Camera error: ${e.message}`
      )
      setStatus('error')
      return
    }

    // ── Size canvas to the actual camera resolution ───────────────────────
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720
    const W = canvas.width, H = canvas.height
    const halfW = W / 2, halfH = H / 2

    // ── Three.js orthographic scene  (1 unit = 1 pixel) ──────────────────
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const cam = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 1, 3000)
    cam.position.set(0, 0, 500)
    cam.lookAt(0, 0, 0)
    cameraRef.current = cam

    const offscreen = document.createElement('canvas')
    offscreen.width = W; offscreen.height = H
    offscreenRef.current = offscreen

    const renderer = new THREE.WebGLRenderer({
      canvas: offscreen, alpha: true, antialias: true,
      powerPreference: 'high-performance', preserveDrawingBuffer: true,
    })
    renderer.setSize(W, H)
    renderer.setPixelRatio(1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.0))
    const key  = new THREE.DirectionalLight(0xffffff, 0.7)
    key.position.set(1, 2, 3); scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.3)
    fill.position.set(-1, 0, -2); scene.add(fill)

    // ── Face depth occluder (unit circle, scaled per-frame to match face oval) ────
    // This invisible mesh writes to the depth buffer at z=-20 so the temple arms
    // of the glasses that fall "behind" the face are correctly hidden — exactly
    // how Snapchat / Fittingbox implement glasses temple occlusion.
    const occShape = new THREE.Shape()
    occShape.absellipse(0, 0, 1, 1, 0, Math.PI * 2, false, 0)
    const occGeo = new THREE.ShapeGeometry(occShape, 40)
    const occMat = new THREE.MeshBasicMaterial({
      colorWrite: false,   // invisible — writes ONLY to depth buffer
      depthWrite: true,
      side: THREE.FrontSide,
    })
    const occluder = new THREE.Mesh(occGeo, occMat)
    occluder.renderOrder = 0      // render before glasses so depth is written first
    occluder.visible = false      // hidden until first face detection
    scene.add(occluder)
    occluderRef.current = occluder

    // ── Load GLB glasses model ────────────────────────────────────────────
    try {
      const gltf = await new Promise<any>((res, rej) =>
        new GLTFLoader().load(product.modelPath, res, undefined, rej)
      )
      const model  = gltf.scene
      const box    = new THREE.Box3().setFromObject(model)
      const size   = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      // Centre model so it pivots around nose bridge when we translate
      model.position.set(-center.x, -center.y, -center.z)
      modelWRef.current = size.x
      console.log('[AR] model w:', size.x.toFixed(4), 'h:', size.y.toFixed(4), 'd:', size.z.toFixed(4))

      // Face the camera (+Z direction).  Most glasses GLBs face -Z by default.
      model.rotation.y = Math.PI

      // Material pass
      model.traverse((child: any) => {
        if (!child.isMesh) return
        child.frustumCulled = false
        if (!child.material) return
        const mat = child.material.clone()
        child.material = mat
        mat.needsUpdate = true
        mat.side = THREE.DoubleSide

        const isLens =
          mat.transparent ||
          (mat.opacity !== undefined && mat.opacity < 0.95) ||
          (mat.transmission !== undefined && mat.transmission > 0.1)

        if (isLens) {
          mat.transparent = true
          if (!mat.opacity || mat.opacity >= 1) mat.opacity = 0.45
          mat.depthWrite = false
        } else {
          if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.65)
          if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.20)
        }
      })

      const group = new THREE.Group()
      group.add(model)
      group.renderOrder = 1   // render AFTER the depth-only face occluder
      group.visible = false
      scene.add(group)
      glassesRef.current = group

      // Ensure every mesh inside the group also uses renderOrder=1 and tests depth
      group.traverse((child: any) => {
        if (child.isMesh) {
          child.renderOrder = 1
          if (child.material) child.material.depthTest = true
        }
      })
    } catch (e: any) {
      console.error('[AR] model load:', e)
      setErrMsg('Failed to load glasses model.')
      setStatus('error')
      initRef.current = false
      return
    }

    // ── MediaPipe Face Mesh ───────────────────────────────────────────────
    const fm = new FaceMesh({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    })
    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,          // adds iris landmarks 468-477
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    })
    faceMeshRef.current = fm

    // ── Per-frame result handler ──────────────────────────────────────────
    fm.onResults(results => {
      busyRef.current = false

      // Draw RAW (not flipped) video straight to the canvas.
      // The CSS `transform: scaleX(-1)` on the canvas element provides the
      // selfie-mirror flip for the viewer — no manual ctx flip needed.
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(results.image, 0, 0, W, H)

      const lms = results.multiFaceLandmarks?.[0]
      if (!lms) {
        setFaceLive(false)
        if (glassesRef.current) glassesRef.current.visible = false
        if (occluderRef.current) occluderRef.current.visible = false
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current)
          ctx.drawImage(offscreenRef.current!, 0, 0)
        }
        return
      }
      setFaceLive(true)

      // ── Landmark extraction — raw pixel coords (NO 1-lm.x flip) ───────
      // lm.x and lm.y are in [0,1], normalised by image W and H.
      // We multiply directly — no mirror inversion required because the
      // CSS transform on the canvas handles the visual mirror.
      const px = (l: { x: number }) => l.x * W
      const py = (l: { y: number }) => l.y * H

      // Iris centres (refineLandmarks=true) — only X needed; Y anchor comes from nose/glabella
      const liX = px(lms[468] ?? lms[133])
      const riX = px(lms[473] ?? lms[362])

      // Outer eye corners (roll + span)
      const loX = px(lms[33]),  loY = py(lms[33])
      const roX = px(lms[263]), roY = py(lms[263])

      // Inner eye corners (roll stability)
      const liInX = px(lms[133]), liInY = py(lms[133])
      const riInX = px(lms[362]), riInY = py(lms[362])

      // Nose bridge (168) and glabella (6) for Y anchor
      const nbY = py(lms[168])
      const gbY = py(lms[6])

      // Temple landmarks (127 left, 356 right) — true glasses width span
      const ltX = px(lms[127]), ltY = py(lms[127])
      const rtX = px(lms[356]), rtY = py(lms[356])

      // Face oval landmarks for occluder
      // 234 = left cheek/ear edge,  454 = right cheek/ear edge
      // 10  = forehead top,         152 = chin bottom
      const fEarLX = px(lms[234]), fEarLY = py(lms[234])
      const fEarRX = px(lms[454]), fEarRY = py(lms[454])
      const fTopY  = py(lms[10])
      const fBotY  = py(lms[152])

      // ── Face measurements ───────────────────────────────────────────────
      const templeSpan   = Math.hypot(rtX - ltX, rtY - ltY)
      const outerEyeSpan = Math.hypot(roX - loX, roY - loY)

      // ── Calibration scan ────────────────────────────────────────────────
      if (phaseRef.current === 'scanning') {
        scanBufRef.current.push({ ts: templeSpan, oe: outerEyeSpan })
        const pct = Math.round(Math.min(scanBufRef.current.length / SCAN_FRAMES, 1) * 100)
        setScanPct(pct)

        if (scanBufRef.current.length >= SCAN_FRAMES) {
          const n   = scanBufRef.current.length
          const avg = (key: 'ts' | 'oe') => scanBufRef.current.reduce((s, f) => s + f[key], 0) / n
          // Store the pixel-span → scene-unit conversion ratio.
          // scaleRatioRef encodes:   (product.scale / modelNativeWidth)
          // Every frame: sf = scaleRatioRef * liveSpan   → glasses resize with face automatically.
          const blendedAvg = avg('ts') * 0.7 + avg('oe') * 0.3
          scaleRatioRef.current = (product.scale / modelWRef.current)
          calibRef.current = scaleRatioRef.current * blendedAvg  // initial scale (for first frame)
          console.log('[AR] calibrated ratio:', scaleRatioRef.current.toFixed(4),
            ' initial scale:', calibRef.current.toFixed(3),
            ' temple px:', avg('ts').toFixed(1))
          phaseRef.current = 'done'
          setStatus('running')
        }

        // Glasses still hidden during scan — just render video
        if (occluderRef.current) occluderRef.current.visible = false
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current)
          ctx.drawImage(offscreenRef.current!, 0, 0)
        }
        return
      }

      if (!calibRef.current) return   // safety guard

      // ── Anchor position ─────────────────────────────────────────────────
      // X = midpoint of iris centres (true optical axis)
      // Y = average nose-bridge + glabella (stable, resists brow movement)
      const anchorX = (liX + riX) / 2
      const anchorY = (nbY + gbY) / 2

      // ── Head roll ───────────────────────────────────────────────────────
      // Average outer + inner corner vectors for jitter reduction
      const rollA = Math.atan2(roY - loY, roX - loX)
      const rollB = Math.atan2(riInY - liInY, riInX - liInX)
      const roll  = (rollA + rollB) / 2

      // ── Three.js orthographic coords ────────────────────────────────────
      // Canvas centre = origin,  +x right,  +y UP
      const posX = anchorX - halfW
      const posY = -(anchorY - halfH) + product.offsetY

      // ── Face depth occluder — update shape each frame ─────────────────
      // The occluder is a depth-only ellipse at z=-20 (behind the glasses
      // front frame at z≈0 but in front of the temple tips at z<-20).
      // Any glasses geometry that falls behind this plane gets depth-clipped,
      // making temples appear to pass behind the face / ears.
      if (occluderRef.current) {
        // Face centre in ortho coords
        const faceCX = (fEarLX + fEarRX) / 2 - halfW
        const faceCY = -((fEarLY + fEarRY) / 2 - halfH)

        // Half-widths of the face oval — add 15% padding so ears are fully covered
        const faceHW = Math.hypot(fEarRX - fEarLX, fEarRY - fEarLY) * 0.58
        const faceHH = Math.abs(fBotY - fTopY) * 0.56

        occluderRef.current.position.set(faceCX, faceCY, -20)
        occluderRef.current.scale.set(faceHW, faceHH, 1)
        occluderRef.current.rotation.z = -roll
        occluderRef.current.visible = true
      }

      // ── Apply to glasses group with LERP smoothing ───────────────────────
      // KEY: scale is re-computed from LIVE landmark pixel span every frame.
      // As the user moves closer  → templeSpan px grows   → sf grows   → glasses stay fitted.
      // As the user moves farther → templeSpan px shrinks → sf shrinks → glasses stay fitted.
      // The locked calibration phase only determines WHEN to show the glasses (stable tracking),
      // not the ongoing scale — that always follows the face.
      const liveSpan = templeSpan * 0.7 + outerEyeSpan * 0.3
      const LERP    = 0.35
      const sf      = scaleRatioRef.current * liveSpan * userScaleRef.current
      const glasses = glassesRef.current!
      const tPos    = new THREE.Vector3(posX, posY, 0)
      const tScale  = new THREE.Vector3(sf, sf, sf)

      if (!glasses.visible) {
        glasses.position.copy(tPos)
        glasses.scale.copy(tScale)
        glasses.rotation.z = -roll
        glasses.visible    = true
      } else {
        glasses.position.lerp(tPos, LERP)
        glasses.scale.lerp(tScale, LERP)
        glasses.rotation.z += (-roll - glasses.rotation.z) * LERP
      }

      // Composite Three.js render over raw video
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
        ctx.drawImage(offscreenRef.current!, 0, 0)
      }
    })

    // ── Frame loop ────────────────────────────────────────────────────────
    const tick = async () => {
      if (!faceMeshRef.current) return
      if (video.readyState >= 2 && !busyRef.current) {
        busyRef.current = true
        try { await faceMeshRef.current.send({ image: video }) }
        catch (e) { console.error('[AR] tick:', e); busyRef.current = false }
      }
      requestAnimationFrame(tick)
    }
    if (video.readyState >= 2) tick()
    else video.addEventListener('loadeddata', tick, { once: true })

    // Reset scan state and start scanning
    scanBufRef.current    = []
    calibRef.current      = null
    scaleRatioRef.current = 1
    phaseRef.current      = 'scanning'
    setScanPct(0)
    setStatus('scanning')
  }, [product])

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (product) initAR()
    return () => stopAR()
  }, [product, initAR, stopAR])

  // ─── Screenshot (applies the CSS mirror manually for the saved image) ─────
  const capture = useCallback(() => {
    const src = canvasRef.current
    if (!src) return
    const tmp  = document.createElement('canvas')
    tmp.width  = src.width
    tmp.height = src.height
    const tc   = tmp.getContext('2d')!
    tc.translate(src.width, 0); tc.scale(-1, 1)   // apply the CSS mirror to the export
    tc.drawImage(src, 0, 0)
    setCaptured(tmp.toDataURL('image/png'))
  }, [])

  // ─── Rescan ───────────────────────────────────────────────────────────────
  const rescan = useCallback(() => {
    scanBufRef.current    = []
    calibRef.current      = null
    scaleRatioRef.current = 1
    phaseRef.current      = 'scanning'
    if (glassesRef.current) glassesRef.current.visible = false
    setScanPct(0)
    setStatus('scanning')
  }, [])

  // ─── Retry camera ─────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    initRef.current = false
    setStatus('loading')
    setErrMsg(null)
    setDenied(false)
    initAR()
  }, [initAR])

  // ─── Product not found ────────────────────────────────────────────────────
  if (!product) return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 text-white">
      <p className="text-lg font-light opacity-70">Product not found</p>
      <button onClick={() => navigate('/collection')}
        className="px-6 py-2 rounded-full border border-white/20 hover:border-yellow-400 hover:text-yellow-400 text-sm transition-colors">
        Back to Collection
      </button>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-[210] flex items-center justify-between
                         px-5 py-3 bg-black/80 backdrop-blur-md border-b border-white/10">
        <motion.button
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => { stopAR(); navigate(`/product/${productId}`) }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20
                     text-white text-sm transition-colors hover:border-yellow-400 hover:text-yellow-400"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </motion.button>

        <motion.span
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-white text-sm font-light tracking-wide"
        >
          Try On: <span className="text-yellow-400">{product.name}</span>
        </motion.span>

        <div className="w-20" />
      </header>

      {/* ── Viewport ─────────────────────────────────────────────────────── */}
      <div ref={containerRef}
        className="relative flex-1 flex items-center justify-center bg-[#111] mt-[52px] overflow-hidden"
        style={{ minHeight: 'calc(100vh - 180px)' }}
      >
        {/* Loading */}
        <AnimatePresence>
          {status === 'loading' && (
            <motion.div key="spin"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-30 bg-[#111]"
            >
              <div className="w-12 h-12 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin" />
              <p className="text-white/70 text-sm">Initialising AR camera…</p>
              <p className="text-white/30 text-xs">Please allow camera access when prompted</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-30 px-8 text-center bg-[#111]"
          >
            <div className="w-12 h-12 rounded-full border border-red-400/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{errMsg}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {denied && (
                <button onClick={retry}
                  className="px-5 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/40
                             text-yellow-400 text-sm hover:bg-yellow-400/20 transition-colors">
                  Try Again
                </button>
              )}
              <button onClick={() => navigate(`/product/${productId}`)}
                className="px-5 py-2 rounded-full border border-white/20 text-white/60 text-sm hover:border-white/40 transition-colors">
                Return to Product
              </button>
            </div>
          </motion.div>
        )}

        {/* ── AR canvas + overlays ─────────────────────────────────────── */}
        <div className="relative w-full h-full max-w-3xl mx-auto">
          {/* hidden video element — MediaPipe reads from this */}
          <video ref={videoRef} autoPlay playsInline muted className="hidden" />

          {/*
            THE KEY:  style={{ transform: 'scaleX(-1)' }}
            This single CSS rule flips the entire canvas horizontally so the
            viewer sees a selfie mirror — without any canvas-context flipping.
            Because both the video pixels AND the Three.js glasses pixels are
            drawn in raw (unflipped) space and then CSS-mirrored together,
            the glasses always appear on the correct side of the face.
          */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
            style={{
              transform: 'scaleX(-1)',
              display: status === 'error' || status === 'loading' ? 'none' : 'block',
            }}
          />

          {/* Scan overlay */}
          <AnimatePresence>
            {status === 'scanning' && (
              <motion.div key="scan"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ background: 'rgba(0,0,0,0.18)' }}
              >
                {/* Face guide */}
                <div className="relative" style={{ width: 240, height: 320 }}>
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 320" fill="none"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.6))' }}>
                    {/* corner brackets */}
                    <path d="M46 16 L16 16 L16 52"  stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M194 16 L224 16 L224 52" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M46 304 L16 304 L16 268" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M194 304 L224 304 L224 268" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                    {/* oval */}
                    <ellipse cx="120" cy="160" rx="100" ry="138"
                      stroke="rgba(212,175,55,0.3)" strokeWidth="1.5" strokeDasharray="6 5"/>
                  </svg>

                  {/* animated scan line */}
                  <div className="absolute left-[8%] right-[8%] h-[2px] rounded-full"
                    style={{
                      background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.95) 50%,transparent)',
                      boxShadow: '0 0 12px 3px rgba(212,175,55,0.5)',
                      animation: 'scanLine 1.8s ease-in-out infinite',
                    }}
                  />
                </div>

                {/* Progress */}
                <div className="mt-6 flex flex-col items-center gap-3" style={{ width: 220 }}>
                  <p className="text-white text-sm font-medium text-center tracking-wide">
                    {scanPct < 100 ? 'Hold still — scanning your face…' : 'Calibration complete!'}
                  </p>
                  <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-[width] duration-100"
                      style={{
                        width: `${scanPct}%`,
                        background: 'linear-gradient(90deg,#92660a,#D4AF37,#f0d060)',
                        boxShadow: '0 0 6px rgba(212,175,55,0.5)',
                      }}
                    />
                  </div>
                  <p className="text-white/40 text-xs tabular-nums">{scanPct}%</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Face tracking badge */}
          {status === 'running' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className={`absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2
                         px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border
                         ${faceLive
                           ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                           : 'bg-black/50 border-white/15 text-white/50'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${faceLive ? 'bg-emerald-400' : 'bg-white/40 animate-pulse'}`}/>
              {faceLive ? 'Face tracked' : 'Searching…'}
              <button onClick={rescan} title="Re-calibrate"
                className="ml-1 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                ↺
              </button>
            </motion.div>
          )}
        </div>

        {/* Screenshot preview */}
        <AnimatePresence>
          {captured && (
            <motion.div key="cap"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/95 flex flex-col rounded-none"
            >
              <img src={captured} alt="Capture" className="flex-1 object-contain" />
              <div className="flex gap-3 p-4 justify-center bg-black">
                <button onClick={() => {
                  const a = document.createElement('a')
                  a.download = `ar-${Date.now()}.png`; a.href = captured; a.click()
                }}
                  className="flex items-center gap-2 px-5 py-2 rounded-full
                             bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 text-sm
                             hover:bg-yellow-400/20 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Save Photo
                </button>
                <button onClick={() => setCaptured(null)}
                  className="px-5 py-2 rounded-full border border-white/20 text-white/60 text-sm hover:border-white/40 transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {(status === 'running' || status === 'scanning') && (
          <motion.div key="controls"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-5 px-6 bg-[#0a0a0a] border-t border-white/5"
          >
            {/* Size scaler */}
            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
              <div className="flex items-center justify-between w-full">
                <span className="text-white/40 text-xs tracking-wide">Size</span>
                <span className="text-yellow-400/70 text-xs tabular-nums">{Math.round(userScale * 100)}%</span>
              </div>
              <div className="flex items-center gap-3 w-full">
                {/* Decrease */}
                <button
                  onClick={() => setUserScale(s => parseFloat(Math.max(0.6, s - 0.05).toFixed(2)))}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center
                             text-white/60 hover:border-yellow-400/60 hover:text-yellow-400 transition-colors text-base leading-none"
                  aria-label="Decrease size"
                >−</button>

                {/* Slider */}
                <input
                  type="range"
                  min={0.6} max={1.5} step={0.01}
                  value={userScale}
                  onChange={e => setUserScale(parseFloat(e.target.value))}
                  className="flex-1 h-1 appearance-none rounded-full cursor-pointer
                             accent-yellow-400"
                  style={{
                    background: `linear-gradient(to right, #D4AF37 ${((userScale - 0.6) / 0.9) * 100}%, rgba(255,255,255,0.12) 0%)`,
                  }}
                />

                {/* Increase */}
                <button
                  onClick={() => setUserScale(s => parseFloat(Math.min(1.5, s + 0.05).toFixed(2)))}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center
                             text-white/60 hover:border-yellow-400/60 hover:text-yellow-400 transition-colors text-base leading-none"
                  aria-label="Increase size"
                >+</button>

                {/* Reset */}
                <button
                  onClick={() => setUserScale(1.0)}
                  title="Reset size"
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center
                             text-white/30 hover:text-white/60 hover:border-white/25 transition-colors text-xs"
                >↺</button>
              </div>
            </div>

            {/* Camera shutter */}
            <button
              onClick={capture}
              disabled={status !== 'running'}
              className="flex flex-col items-center gap-2 group disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <span className="w-14 h-14 rounded-full border-2 border-white/15 flex items-center justify-center
                               bg-white/5 group-hover:bg-white/10 transition-colors group-disabled:bg-transparent">
                <svg className="w-6 h-6 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </span>
              <span className="text-white/50 text-xs">Capture</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tips ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] px-6 pb-5">
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-1">
          {[['💡','Good lighting'],['📱','Camera at eye level'],['👤','Look straight ahead'],['🖼️','Neutral background']].map(([ic,tip])=>(
            <li key={tip} className="flex items-center gap-1.5 text-white/30 text-xs"><span>{ic}</span>{tip}</li>
          ))}
        </ul>
      </div>

      {/* scan-line keyframe */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 4%;  opacity: 0 }
          8%   { opacity: 1 }
          92%  { opacity: 1 }
          100% { top: 88%; opacity: 0 }
        }
      `}</style>
    </main>
  )
}

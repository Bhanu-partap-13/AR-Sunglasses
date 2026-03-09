/**
 * EyeWearTryOnPage v3 — Snapchat-style fullscreen AR try-on
 *
 * Based on bensonruan/Virtual-Glasses-Try-on reference approach:
 *   Key landmarks: 168 (midEye), 143 (leftEye), 2 (noseBottom), 372 (rightEye)
 *
 * KEY FIXES (v3):
 *  1. Square camera viewport — centre-cropped from camera feed
 *  2. Face scanning phase (30 frames) — glasses appear after stable detection
 *  3. Roll-only rotation derived from up-vector (midEye→noseBottom)
 *     — NO yaw/pitch (which was causing "revolving around face" in v1)
 *  4. Scale from leftEye↔rightEye distance (landmarks 143↔372)
 *  5. Position anchored at landmark 168 (nose bridge / midEye)
 *  6. Non-blocking capture — uses toBlob()
 *  7. Proportional depth occluder for temple arm clipping
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FaceMesh } from '@mediapipe/face_mesh'

//  Glasses catalogue (GLTF models)
const GLASSES_CATALOGUE = [
  { id: 'cartoon_glasses',     name: 'Cartoon',       modelPath: '/models/gltf/cartoon_glasses/scene.gltf',     offsetY: 0, scale: 1.0 },
  { id: 'cazal_sunglasses',    name: 'Cazal',         modelPath: '/models/gltf/cazal_sunglasses/scene.gltf',    offsetY: 0, scale: 1.0 },
  { id: 'glasses1',            name: 'Classic',       modelPath: '/models/gltf/glasses1/scene.gltf',            offsetY: 0, scale: 1.0 },
  { id: 'glasses_07',          name: 'Glasses 07',    modelPath: '/models/gltf/glasses_07/scene.gltf',          offsetY: 0, scale: 1.0 },
  { id: 'plastic_sunglasses',  name: 'Plastic',       modelPath: '/models/gltf/plastic_sunglasses/scene.gltf',  offsetY: 0, scale: 1.0 },
  { id: 'sport_glasses_b307',  name: 'Sport',         modelPath: '/models/gltf/sport_glasses_b307/scene.gltf',  offsetY: 0, scale: 1.0 },
]

type GlassesEntry = typeof GLASSES_CATALOGUE[0]
const SCAN_FRAMES = 30

// Module-level carousel icons (never recreated)
const CAROUSEL_ICONS: Record<string, JSX.Element> = {
  'cartoon_glasses': (
    <svg viewBox="0 0 64 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="16" cy="15" rx="14" ry="11" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <ellipse cx="48" cy="15" rx="14" ry="11" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <path d="M30 12 Q32 8 34 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M2 10 L0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M62 10 L64 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'cazal_sunglasses': (
    <svg viewBox="0 0 68 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="17" cy="13" rx="15" ry="10" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <ellipse cx="51" cy="13" rx="15" ry="10" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <path d="M32 10 Q34 8 36 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M2 10 L0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M66 10 L68 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'glasses1': (
    <svg viewBox="0 0 64 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="16" cy="15" rx="14" ry="10" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <ellipse cx="48" cy="15" rx="14" ry="10" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <path d="M30 10 Q32 7 34 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M2 8 L0 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M62 8 L64 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'glasses_07': (
    <svg viewBox="0 0 64 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="2" y="4" width="27" height="18" rx="3" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <rect x="35" y="4" width="27" height="18" rx="3" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <path d="M29 13 Q32 10 35 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M2 13 L0 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M62 13 L64 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'plastic_sunglasses': (
    <svg viewBox="0 0 64 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="2" y="5" width="27" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <rect x="35" y="5" width="27" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <path d="M29 13 Q32 11 35 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M2 13 L0 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M62 13 L64 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'sport_glasses_b307': (
    <svg viewBox="0 0 68 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <path d="M2 12 C2 6 8 2 18 4 L30 8 Q34 6 38 8 L50 4 C60 2 66 6 66 12 C66 18 58 22 48 18 L38 14 Q34 16 30 14 L20 18 C10 22 2 18 2 12Z"
        stroke="currentColor" strokeWidth="2" fill="rgba(255,255,255,0.08)"/>
      <path d="M2 12 L0 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M66 12 L68 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
}

//  Component 
export default function EyeWearTryOnPage() {
  const navigate = useNavigate()

  // DOM refs
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Three.js refs
  const sceneRef     = useRef<THREE.Scene | null>(null)
  const cameraRef    = useRef<THREE.OrthographicCamera | null>(null)
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const glassesRef   = useRef<THREE.Group | null>(null)
  const occluderRef  = useRef<THREE.Mesh | null>(null)
  const modelWRef    = useRef(1)
  const modelDRef    = useRef(0.4) // native model depth for occluder scaling

  // MediaPipe
  const faceMeshRef = useRef<FaceMesh | null>(null)
  const initRef     = useRef(false)
  const busyRef     = useRef(false)

  // Scan/calibration
  const scanBufRef    = useRef<{ts: number, oe: number}[]>([])
  const calibRef      = useRef<number | null>(null)
  const phaseRef      = useRef<'scanning' | 'ready'>('scanning')
  const scaleRatioRef = useRef(1)

  // Square crop info (filled once on camera init)
  const cropRef = useRef({ vW: 720, vH: 720, S: 720, cropX: 0, cropY: 0 })

  // UI
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [status,      setStatus]      = useState<'loading' | 'scanning' | 'running' | 'error'>('loading')
  const [errMsg,      setErrMsg]      = useState<string | null>(null)
  const [faceLive,    setFaceLive]    = useState(false)
  const [captured,    setCaptured]    = useState<string | null>(null)
  const [scanPct,     setScanPct]     = useState(0)
  const [userScale,   setUserScale]   = useState(1.0)
  const userScaleRef = useRef(1.0)
  useEffect(() => { userScaleRef.current = userScale }, [userScale])

  // Guards
  const activeEntryRef = useRef<GlassesEntry | null>(null)
  const loadKeyRef     = useRef(0)
  const selectedIdxRef = useRef(0)
  useEffect(() => { selectedIdxRef.current = selectedIdx }, [selectedIdx])
  const mountedRef = useRef(true)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  //  Cleanup 
  const stopAR = useCallback(() => {
    if (videoRef.current?.srcObject) {
      ;(videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    faceMeshRef.current?.close()
    faceMeshRef.current  = null
    rendererRef.current?.dispose()
    rendererRef.current  = null
    sceneRef.current?.clear()
    sceneRef.current     = null
    offscreenRef.current = null
    glassesRef.current   = null
    occluderRef.current  = null
    activeEntryRef.current = null
    loadKeyRef.current   = 0
    initRef.current      = false
    busyRef.current      = false
    scanBufRef.current   = []
    calibRef.current     = null
    scaleRatioRef.current = 1
    phaseRef.current     = 'scanning'
  }, [])

  //  Load / swap glasses model 
  const loadGlassesModel = useCallback(async (entry: GlassesEntry) => {
    if (!sceneRef.current) return
    const scene = sceneRef.current
    const myKey = ++loadKeyRef.current

    if (glassesRef.current) { scene.remove(glassesRef.current); glassesRef.current = null }

    const gltf = await new Promise<any>((res, rej) =>
      new GLTFLoader().load(entry.modelPath, res, undefined, rej)
    )
    if (myKey !== loadKeyRef.current || !sceneRef.current) return
    const model  = gltf.scene
    const box    = new THREE.Box3().setFromObject(model)
    const size   = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    model.position.set(-center.x, -center.y, -center.z)
    modelWRef.current = size.x
    modelDRef.current = size.z || size.x * 0.4

    // Keep original model orientation facing forward (Math.PI flips it to +Z so temples go backwards)
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
        if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.7)
        if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.18)
      }
    })

    const group = new THREE.Group()
    group.add(model)
    group.renderOrder = 1
    group.visible = false
    scene.add(group)
    glassesRef.current = group

    group.traverse((child: any) => {
      if (child.isMesh) {
        child.renderOrder = 1
        if (child.material) child.material.depthTest = true
      }
    })

    activeEntryRef.current = entry
    // Store scale ratio for this model
    scaleRatioRef.current = entry.scale / modelWRef.current
  }, [])

  //  Init AR 
  const initAR = useCallback(async (initialEntry: GlassesEntry) => {
    if (!videoRef.current || !canvasRef.current || initRef.current) return
    initRef.current = true

    const video  = videoRef.current
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d', { willReadFrequently: true })!

    //  Camera — request square-ish, we will crop to square 
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
      })
      if (!containerRef.current) { stream.getTracks().forEach(t => t.stop()); return }
      video.srcObject = stream
      await new Promise<void>(res => { video.onloadedmetadata = () => res() })
      await video.play().catch(e => console.warn('[AR] play:', e))
    } catch (e: any) {
      console.error('[AR] camera:', e)
      initRef.current = false
      setErrMsg(
        e.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access.' :
        e.name === 'NotFoundError'   ? 'No camera found on this device.' :
        `Camera error: ${e.message}`
      )
      setStatus('error'); return
    }

    //  Square crop from camera feed 
    const vW = video.videoWidth  || 720
    const vH = video.videoHeight || 720
    const S  = Math.min(vW, vH)
    const cropX = Math.floor((vW - S) / 2)
    const cropY = Math.floor((vH - S) / 2)
    cropRef.current = { vW, vH, S, cropX, cropY }

    canvas.width  = S
    canvas.height = S
    const W = S, H = S, halfW = W / 2, halfH = H / 2

    //  Three.js orthographic (1 unit = 1 px) 
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const cam = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 1, 4000)
    cam.position.set(0, 0, 1000)
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
    scene.add(new THREE.AmbientLight(0xffffff, 1.2))
    const key = new THREE.DirectionalLight(0xffffff, 0.8)
    key.position.set(2, 4, 6); scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.4)
    fill.position.set(-2, 0, 3); scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 0.25)
    rim.position.set(-4, 2, -3); scene.add(rim)

    //  Face depth occluder 
    const occShape = new THREE.Shape()
    occShape.absellipse(0, 0, 1, 1, 0, Math.PI * 2, false, 0)
    const occGeo = new THREE.ShapeGeometry(occShape, 48)
    const occMat = new THREE.MeshBasicMaterial({
      colorWrite: false, depthWrite: true, side: THREE.FrontSide,
    })
    const occluder = new THREE.Mesh(occGeo, occMat)
    occluder.renderOrder = 0
    occluder.visible = false
    scene.add(occluder)
    occluderRef.current = occluder

    // Load initial model
    try { await loadGlassesModel(initialEntry) }
    catch (e: any) {
      console.error('[AR] model:', e)
      setErrMsg('Failed to load glasses model.')
      setStatus('error'); initRef.current = false; return
    }

    //  MediaPipe FaceMesh 
    const fm = new FaceMesh({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    })
    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    })
    faceMeshRef.current = fm

    //  Per-frame handler 
    fm.onResults(results => {
      busyRef.current = false
      const { vW: cVW, vH: cVH, S: cS, cropX: cCropX, cropY: cCropY } = cropRef.current

      // Draw centre-square crop of raw video (CSS scaleX(-1) provides mirror)
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(results.image, cCropX, cCropY, cS, cS, 0, 0, W, H)

      const lms = results.multiFaceLandmarks?.[0]
      if (!lms) {
        if (mountedRef.current) setFaceLive(false)
        if (glassesRef.current) glassesRef.current.visible = false
        if (occluderRef.current) occluderRef.current.visible = false
        // Reset scan if face lost during scanning
        if (phaseRef.current === 'scanning') {
          scanBufRef.current = []
          if (mountedRef.current) setScanPct(0)
        }
        if (rendererRef.current && sceneRef.current && cameraRef.current)
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0)
        return
      }
      if (mountedRef.current) setFaceLive(true)

      // ── Landmark pixel positions (mapped to cropped square) ─────────
      // Reference landmarks from bensonruan/Virtual-Glasses-Try-on:
      //   168 = midEye (nose bridge), 143 = leftEye, 2 = noseBottom, 372 = rightEye
      const px = (l: { x: number }) => (l.x * cVW - cCropX) * (W / cS)
      const py = (l: { y: number }) => (l.y * cVH - cCropY) * (H / cS)

      // Key face landmarks (matching reference repo)
      const midEyeX = px(lms[168]), midEyeY = py(lms[168])
      const leftEyeX = px(lms[143]), leftEyeY = py(lms[143])
      const rightEyeX = px(lms[372]), rightEyeY = py(lms[372])
      const noseBottomX = px(lms[2]), noseBottomY = py(lms[2])

      // Face oval for occluder
      const fEarLX = px(lms[234]), fEarLY = py(lms[234])
      const fEarRX = px(lms[454]), fEarRY = py(lms[454])
      const fTopY  = py(lms[10])
      const fBotY  = py(lms[152])

      // ── Eye distance — primary scale measurement (reference approach) ──
      const eyeDist = Math.sqrt(
        (leftEyeX - rightEyeX) ** 2 +
        (leftEyeY - rightEyeY) ** 2
      )

      // ── Scanning phase ─────────────────────────────────────────────────
      if (phaseRef.current === 'scanning') {
        scanBufRef.current.push({ ts: eyeDist, oe: eyeDist })
        const pct = Math.round(Math.min(scanBufRef.current.length / SCAN_FRAMES, 1) * 100)
        if (mountedRef.current) setScanPct(pct)

        if (scanBufRef.current.length >= SCAN_FRAMES) {
          const baseScale = activeEntryRef.current?.scale || 1
          scaleRatioRef.current = (baseScale / (modelWRef.current || 1))
          calibRef.current = scaleRatioRef.current * eyeDist
          
          phaseRef.current = 'ready'
          if (mountedRef.current) setStatus('running')
        } else {
          // During scan — render video only (no glasses)
          if (occluderRef.current) occluderRef.current.visible = false
          if (rendererRef.current && sceneRef.current && cameraRef.current)
            rendererRef.current.render(sceneRef.current, cameraRef.current)
          if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0)
          return
        }
      }

      if (!calibRef.current) return

      // ── Up vector (midEye → noseBottom) — head tilt detection ─────────
      // Reference: glasses.up = normalize(midEye - noseBottom)
      // In canvas coords Y increases downward; Three.js Y increases upward → negate Y
      let upX = midEyeX - noseBottomX
      let upY = -(midEyeY - noseBottomY)
      const upLen = Math.sqrt(upX ** 2 + upY ** 2) || 1
      upX /= upLen
      upY /= upLen

      // ── Roll from up vector (reference approach) ───────────────────────
      // When head is upright, upX ≈ 0 → acos(0) = π/2 → roll = 0
      // Tilting head right → upX > 0 → acos(upX) < π/2 → positive roll
      const roll = Math.PI / 2 - Math.acos(Math.max(-1, Math.min(1, upX)))

      // ── Position at midEye (landmark 168) ──────────────────────────────
      const posX = midEyeX - halfW
      const posY = -(midEyeY - halfH) + (activeEntryRef.current?.offsetY ?? 0)

      // ── Scale from live eye distance ───────────────────────────────────
      const sf = scaleRatioRef.current * eyeDist * userScaleRef.current

      // ── Smoothing ──────────────────────────────────────────────────────
      const LERP = 0.35

      const glasses = glassesRef.current
      if (!glasses) {
        if (rendererRef.current && sceneRef.current && cameraRef.current)
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0)
        return
      }

      const tPos   = new THREE.Vector3(posX, posY, 0)
      const tScale = new THREE.Vector3(sf, sf, sf)

      if (!glasses.visible) {
        // First frame after scan — snap immediately
        glasses.position.copy(tPos)
        glasses.scale.copy(tScale)
        glasses.rotation.z = -roll
        glasses.visible = true
      } else {
        glasses.position.lerp(tPos, LERP)
        glasses.scale.lerp(tScale, LERP)
        glasses.rotation.z += (-roll - glasses.rotation.z) * LERP
      }

      // ── Occluder — depth-only face ellipse (roll-only, no yaw/pitch) ──
      if (occluderRef.current) {
        const scaledTempleDepth = sf * modelDRef.current
        const faceCX = (fEarLX + fEarRX) / 2 - halfW
        const faceCY = -((fEarLY + fEarRY) / 2 - halfH)
        const faceHW = Math.hypot(fEarRX - fEarLX, fEarRY - fEarLY) * 0.58
        const faceHH = Math.abs(fBotY - fTopY) * 0.56
        
        occluderRef.current.position.set(faceCX, faceCY, -scaledTempleDepth * 0.65)
        occluderRef.current.scale.set(faceHW, faceHH, 1)
        occluderRef.current.rotation.z = -roll
        occluderRef.current.visible = true
      }

      // Composite Three.js over video
      if (rendererRef.current && sceneRef.current && cameraRef.current)
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0)
    })

    //  Frame loop 
    const tick = async () => {
      if (!faceMeshRef.current) return
      if (video.readyState >= 2 && !busyRef.current) {
        busyRef.current = true
        try { await faceMeshRef.current.send({ image: video }) }
        catch { busyRef.current = false }
      }
      requestAnimationFrame(tick)
    }
    if (video.readyState >= 2) tick()
    else video.addEventListener('loadeddata', tick, { once: true })

    // Start scanning phase
    scanBufRef.current = []
    phaseRef.current = 'scanning'
    if (mountedRef.current) { setStatus('scanning'); setScanPct(0) }

    // If user already picked a different model during init, load it
    const desired = GLASSES_CATALOGUE[selectedIdxRef.current]
    if (desired.id !== (activeEntryRef.current?.id ?? '')) {
      loadGlassesModel(desired).catch(console.error)
    }
  }, [loadGlassesModel])

  //  Lifecycle 
  useEffect(() => {
    initAR(GLASSES_CATALOGUE[selectedIdx])
    return () => stopAR()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //  Swap model 
  useEffect(() => {
    const entry = GLASSES_CATALOGUE[selectedIdx]
    if (activeEntryRef.current?.id === entry.id) return
    if (!sceneRef.current) return
    if (glassesRef.current) glassesRef.current.visible = false
    // Re-scan when swapping models for proper fit
    scanBufRef.current = []
    phaseRef.current = 'scanning'
    if (mountedRef.current) { setStatus('scanning'); setScanPct(0) }
    loadGlassesModel(entry).catch(console.error)
  }, [selectedIdx, loadGlassesModel])

  //  Non-blocking capture 
  const capture = useCallback(() => {
    const src = canvasRef.current
    if (!src) return
    requestAnimationFrame(() => {
      const tmp = document.createElement('canvas')
      tmp.width = src.width; tmp.height = src.height
      const tc = tmp.getContext('2d')!
      tc.translate(src.width, 0); tc.scale(-1, 1)
      tc.drawImage(src, 0, 0)
      tmp.toBlob(blob => {
        if (!blob || !mountedRef.current) return
        setCaptured(URL.createObjectURL(blob))
      }, 'image/png')
    })
  }, [])

  //  Rescan 
  const rescan = useCallback(() => {
    scanBufRef.current = []
    phaseRef.current = 'scanning'
    if (glassesRef.current) glassesRef.current.visible = false
    if (mountedRef.current) { setStatus('scanning'); setScanPct(0) }
  }, [])

  // 
  // RENDER
  // 
  return (
    <main style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/*  Top bar  */}
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)',
      }}>
        <motion.button
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => { stopAR(); navigate('/') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.22)',
            color: '#fff', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </motion.button>

        <motion.span
          initial={{ opacity: 0 }} animate={{ opacity: 0.9 }}
          style={{ color: '#fff', fontSize: 15, fontWeight: 600, letterSpacing: '0.06em' }}
        >
          EyeWear <span style={{ color: '#D4AF37' }}>Try On</span>
        </motion.span>

        {/* Face badge */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 99,
            background: faceLive ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${faceLive ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.18)'}`,
            fontSize: 12, fontWeight: 600,
            color: faceLive ? '#34d399' : 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: faceLive ? '#34d399' : 'rgba(255,255,255,0.4)',
            ...(faceLive ? {} : { animation: 'blink 1.2s ease-in-out infinite' }),
          }}/>
          {faceLive ? 'Face tracked' : 'Searching\u2026'}
          {status === 'running' && (
            <button onClick={rescan} title="Re-scan"
              style={{
                marginLeft: 4, background: 'none', border: 'none',
                color: 'inherit', cursor: 'pointer', fontSize: 14, opacity: 0.6,
                padding: 0, lineHeight: 1,
              }}>\u21BA</button>
          )}
        </motion.div>
      </header>

      {/*  Square camera viewport  */}
      <div ref={containerRef} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

        {/* Square canvas wrapper */}
        <div style={{
          position: 'relative',
          width: '100%', maxWidth: '100vh',
          aspectRatio: '1 / 1',
        }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%', height: '100%',
              objectFit: 'contain',
              transform: 'scaleX(-1)',
              borderRadius: 12,
              display: (status === 'error' || status === 'loading') ? 'none' : 'block',
            }}
          />

          {/*  Scan overlay  */}
          <AnimatePresence>
            {status === 'scanning' && (
              <motion.div key="scan"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', borderRadius: 12,
                  background: 'rgba(0,0,0,0.15)',
                }}
              >
                <div style={{ position: 'relative', width: 220, height: 300 }}>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    viewBox="0 0 220 300" fill="none"
                    filter="drop-shadow(0 0 10px rgba(212,175,55,0.6))">
                    <ellipse cx="110" cy="150" rx="95" ry="130"
                      stroke="rgba(212,175,55,0.45)" strokeWidth="1.5" strokeDasharray="6 5"/>
                    <path d="M35 20 L12 20 L12 55" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M185 20 L208 20 L208 55" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M35 280 L12 280 L12 245" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M185 280 L208 280 L208 245" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <div style={{
                    position: 'absolute', left: '10%', right: '10%', height: 2, borderRadius: 1,
                    background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.95) 50%,transparent)',
                    boxShadow: '0 0 12px 3px rgba(212,175,55,0.5)',
                    animation: 'scanLine 1.8s ease-in-out infinite',
                  }}/>
                </div>
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 200 }}>
                  <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, textAlign: 'center',
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                    {scanPct < 100 ? 'Scanning face\u2026' : 'Locked!'}
                  </p>
                  <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${scanPct}%`, height: '100%', borderRadius: 99,
                      background: 'linear-gradient(90deg,#92660a,#D4AF37,#f0d060)',
                      boxShadow: '0 0 6px rgba(212,175,55,0.5)',
                      transition: 'width 80ms linear',
                    }}/>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{scanPct}%</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Face guide when running but no face */}
          <AnimatePresence>
            {status === 'running' && !faceLive && (
              <motion.div key="guide"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                }}
              >
                <svg width="200" height="280" viewBox="0 0 220 300" fill="none"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.4))' }}>
                  <ellipse cx="110" cy="150" rx="90" ry="128" stroke="rgba(212,175,55,0.5)"
                    strokeWidth="1.5" strokeDasharray="7 5"/>
                </svg>
                <div style={{
                  position: 'absolute', bottom: '15%',
                  color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500,
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}>
                  Position your face in the frame
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading spinner */}
        <AnimatePresence>
          {status === 'loading' && (
            <motion.div key="spin"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 16,
                background: '#0a0a0a',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                border: '2px solid rgba(212,175,55,0.15)',
                borderTop: '2px solid #D4AF37',
                animation: 'spin 0.85s linear infinite',
              }}/>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Initialising camera\u2026</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Allow camera access when prompted</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16,
              background: '#0a0a0a', padding: 32, textAlign: 'center',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '1px solid rgba(239,68,68,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{errMsg}</p>
            <button
              onClick={() => { stopAR(); setStatus('loading'); setErrMsg(null); initAR(GLASSES_CATALOGUE[selectedIdx]) }}
              style={{
                padding: '8px 22px', borderRadius: 99,
                background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)',
                color: '#D4AF37', fontSize: 13, cursor: 'pointer',
              }}
            >Try Again</button>
          </motion.div>
        )}
      </div>

      {/*  Bottom panel  */}
      <AnimatePresence>
        {(status !== 'error' && status !== 'loading') && (
          <motion.div key="bottom"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            style={{
              position: 'relative', zIndex: 40,
              background: 'rgba(10,10,10,0.92)',
              backdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              padding: '14px 20px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
          >
            {/* Size slider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 300,
            }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: '0.08em', width: 32 }}>SIZE</span>
              <button
                onClick={() => setUserScale(s => parseFloat(Math.max(0.6, s - 0.05).toFixed(2)))}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                  color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', fontSize: 18, lineHeight: 1,
                }}>-</button>
              <input type="range" min={0.6} max={1.5} step={0.01} value={userScale}
                onChange={e => setUserScale(parseFloat(e.target.value))}
                style={{
                  flex: 1, height: 4, accentColor: '#D4AF37', cursor: 'pointer',
                  background: `linear-gradient(to right, #D4AF37 ${((userScale - 0.6) / 0.9) * 100}%, rgba(255,255,255,0.1) 0%)`,
                  borderRadius: 99, outline: 'none',
                }}/>
              <button
                onClick={() => setUserScale(s => parseFloat(Math.min(1.5, s + 0.05).toFixed(2)))}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                  color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', fontSize: 18, lineHeight: 1,
                }}>+</button>
              <span style={{ color: '#D4AF37', fontSize: 11, width: 32, textAlign: 'right' }}>
                {Math.round(userScale * 100)}%
              </span>
            </div>

            {/* Carousel + shutter */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, width: '100%',
            }}>
              {GLASSES_CATALOGUE.map((g, idx) => {
                const isActive = idx === selectedIdx
                return (
                  <motion.button key={g.id}
                    onClick={() => setSelectedIdx(idx)}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      width: 58, height: 58, borderRadius: '50%',
                      border: isActive ? '2px solid #D4AF37' : '2px solid rgba(255,255,255,0.2)',
                      background: isActive ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', padding: '8px 10px',
                      color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.55)',
                      transition: 'all 0.2s ease', flexShrink: 0,
                    }}
                    title={g.name}
                  >
                    {CAROUSEL_ICONS[g.id] ?? null}
                  </motion.button>
                )
              })}

              {/* Shutter */}
              <motion.button
                onClick={capture}
                disabled={status !== 'running' || !faceLive}
                whileTap={{ scale: 0.88 }}
                style={{
                  width: 66, height: 66, borderRadius: '50%',
                  border: '2.5px solid rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (status === 'running' && faceLive) ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                  opacity: (status === 'running' && faceLive) ? 1 : 0.35,
                  boxShadow: faceLive ? '0 0 0 4px rgba(255,255,255,0.08)' : 'none',
                  transition: 'all 0.3s ease',
                }}
                title="Capture photo"
              >
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: faceLive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.25)',
                  transition: 'background 0.3s',
                }}/>
              </motion.button>
            </div>

            {/* Style names */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {GLASSES_CATALOGUE.map((g, idx) => (
                <span key={g.id} style={{
                  fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: idx === selectedIdx ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                  transition: 'color 0.2s', width: 58, textAlign: 'center',
                }}>{g.name}</span>
              ))}
              <span style={{ width: 66 }}/>
            </div>

            {/* Tips */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[['\uD83D\uDCA1','Good lighting'],['\uD83D\uDCF1','Eye level'],['\uD83D\uDC64','Face forward'],['\u21A9\uFE0F','Turn to see temples']].map(([ic, tip]) => (
                <span key={tip} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: 'rgba(255,255,255,0.28)',
                }}>
                  <span>{ic}</span>{tip}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  Screenshot preview  */}
      <AnimatePresence>
        {captured && (
          <motion.div key="cap"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: '#000', display: 'flex', flexDirection: 'column',
            }}
          >
            <img src={captured} alt="Your look" style={{ flex: 1, objectFit: 'contain' }} />
            <div style={{
              display: 'flex', gap: 12, padding: '16px 24px',
              justifyContent: 'center', background: '#0a0a0a',
            }}>
              <button
                onClick={() => {
                  const a = document.createElement('a')
                  a.download = `eyewear-${Date.now()}.png`
                  a.href = captured; a.click()
                  setTimeout(() => URL.revokeObjectURL(captured), 1000)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 20px', borderRadius: 99,
                  background: 'rgba(212,175,55,0.13)', border: '1px solid rgba(212,175,55,0.45)',
                  color: '#D4AF37', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Save Photo
              </button>
              <button
                onClick={() => { URL.revokeObjectURL(captured); setCaptured(null) }}
                style={{
                  padding: '9px 20px', borderRadius: 99,
                  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                  color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer',
                }}
              >Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyframes */}
      <style>{`
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes blink    { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
        @keyframes scanLine { 0% { top: 5%; opacity: 0 } 8% { opacity: 1 } 92% { opacity: 1 } 100% { top: 88%; opacity: 0 } }
      `}</style>
    </main>
  )
}

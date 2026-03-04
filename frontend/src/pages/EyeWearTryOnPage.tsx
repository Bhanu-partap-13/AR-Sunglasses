/**
 * EyeWearTryOnPage — Snapchat-style fullscreen AR try-on
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  KEY DESIGN DECISIONS                                              │
 * │                                                                    │
 * │  1. CSS scaleX(-1) mirror on canvas — MediaPipe sees raw video,   │
 * │     landmarks are raw coords.  THREE.js draws in raw space.        │
 * │     CSS flip shows the viewer a selfie-mirror with glasses on      │
 * │     the correct side.                                              │
 * │                                                                    │
 * │  2. Eye-level anchor — uses iris landmarks (468, 473) so the      │
 * │     glasses sit ON the eyes, not floating below at nose level.     │
 * │                                                                    │
 * │  3. Full 3D rotation — yaw (head turn), pitch (head tilt up/dn)   │
 * │     and roll (head lean) are applied to glasses.rotation so        │
 * │     temples appear correctly on side-profile views.                │
 * │                                                                    │
 * │  4. Scale anchored to outer-eye span — scales the frame to        │
 * │     exactly cover the eyes; won't look "incoming" toward camera.   │
 * │                                                                    │
 * │  5. Dual-LERP — position snaps fast (0.35), scale changes slowly  │
 * │     (0.12) so glasses don't zoom in/out when face moves in depth.  │
 * └────────────────────────────────────────────────────────────────────┘
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FaceMesh } from '@mediapipe/face_mesh'

// ─── Glasses catalogue (4 entries shown in the bottom carousel) ──────────────
const GLASSES_CATALOGUE = [
  {
    id: 'glasses-7b',
    name: 'Wayfarer',
    modelPath: '/models/glasses-7b.glb',
    offsetY: 0,
    scale: 1.0,
  },
  {
    id: 'glasses1',
    name: 'Aviator',
    modelPath: '/models/glasses1.glb',
    offsetY: 0,
    scale: 1.0,
  },
  {
    id: 'glasses-9c',
    name: 'Retro Square',
    modelPath: '/models/glasses-9c.glb',
    offsetY: 0,
    scale: 1.0,
  },
  {
    id: 'sunglasses',
    name: 'Classic',
    modelPath: '/models/sunglasses.glb',
    offsetY: 0,
    scale: 1.0,
  },
]

type GlassesEntry = typeof GLASSES_CATALOGUE[0]

// ─── Lerp helper ─────────────────────────────────────────────────────────────
const lp = (a: number, b: number, t: number) => a + (b - a) * t

// ─── Carousel icons defined at module level (never recreated on render) ──────
const CAROUSEL_ICONS: Record<string, JSX.Element> = {
  'glasses-7b': (
    <svg viewBox="0 0 64 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="2" y="4" width="27" height="18" rx="3" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <rect x="35" y="4" width="27" height="18" rx="3" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <path d="M29 13 Q32 10 35 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M2 13 L0 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M62 13 L64 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
  'glasses-9c': (
    <svg viewBox="0 0 64 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="2" y="5" width="27" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <rect x="35" y="5" width="27" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <path d="M29 13 Q32 11 35 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M2 13 L0 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M62 13 L64 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'sunglasses': (
    <svg viewBox="0 0 68 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="17" cy="13" rx="15" ry="10" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <ellipse cx="51" cy="13" rx="15" ry="10" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
      <path d="M32 10 Q34 8 36 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M2 10 L0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M66 10 L68 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
}

// ─── Component ───────────────────────────────────────────────────────────────
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
  const modelDRef    = useRef(0.4)  // depth (Z) of model in native units

  // MediaPipe / loop
  const faceMeshRef  = useRef<FaceMesh | null>(null)
  const initRef      = useRef(false)
  const busyRef      = useRef(false)

  // Smoothed state (raw, not React state — updated every frame for performance)
  const sfSmoothedRef  = useRef(1)
  const posSmoothedRef = useRef(new THREE.Vector3())
  const rollSmRef      = useRef(0)
  const yawSmRef       = useRef(0)
  const pitchSmRef     = useRef(0)

  // UI state
  const [selectedIdx,  setSelectedIdx]  = useState(0)
  const [status,       setStatus]       = useState<'loading' | 'running' | 'error'>('loading')
  const [errMsg,       setErrMsg]       = useState<string | null>(null)
  const [faceLive,     setFaceLive]     = useState(false)
  const [captured,     setCaptured]     = useState<string | null>(null)
  const [userScale,    setUserScale]    = useState(1.0)
  const userScaleRef = useRef(1.0)
  useEffect(() => { userScaleRef.current = userScale }, [userScale])

  // Track which glasses entry is loaded as the active model
  const activeEntryRef  = useRef<GlassesEntry | null>(null)
  // Increment to discard stale async model loads (race-condition guard)
  const loadingKeyRef   = useRef(0)
  // Mirrors selectedIdx synchronously so async callbacks can read the latest value
  const selectedIdxRef  = useRef(0)
  useEffect(() => { selectedIdxRef.current = selectedIdx }, [selectedIdx])
  // Guards React state-setters after unmount
  const mountedRef = useRef(true)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  // ─── Helpers ────────────────────────────────────────────────────────────────
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
    sceneRef.current    = null
    offscreenRef.current  = null   // prevent dangling 2D ctx draws after cleanup
    glassesRef.current    = null
    occluderRef.current   = null
    activeEntryRef.current  = null
    loadingKeyRef.current   = 0    // invalidate any pending model loads
    initRef.current     = false
    busyRef.current     = false
    sfSmoothedRef.current = 1
    posSmoothedRef.current.set(0, 0, 0)
    rollSmRef.current   = 0
    yawSmRef.current    = 0
    pitchSmRef.current  = 0
  }, [])

  // ─── Load / swap glasses model ───────────────────────────────────────────
  const loadGlassesModel = useCallback(async (entry: GlassesEntry) => {
    if (!sceneRef.current) return
    const scene = sceneRef.current
    // Claim a unique key — any older pending load will abort when it resolves.
    const myKey = ++loadingKeyRef.current

    // Remove existing glasses group
    if (glassesRef.current) {
      scene.remove(glassesRef.current)
      glassesRef.current = null
    }

    const gltf = await new Promise<any>((res, rej) =>
      new GLTFLoader().load(entry.modelPath, res, undefined, rej)
    )
    // Stale-load guard: bail if a newer request arrived or the component unmounted.
    if (myKey !== loadingKeyRef.current || !sceneRef.current) return
    const model  = gltf.scene
    const box    = new THREE.Box3().setFromObject(model)
    const size   = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    // Centre model so pivot is nose-bridge
    model.position.set(-center.x, -center.y, -center.z)
    modelWRef.current = size.x
    modelDRef.current = size.z || size.x * 0.45  // fallback depth estimate

    // Base orientation: face the camera (+Z), rotation.y handled per-frame
    // No static rotation.y = Math.PI here — we set it every frame for 3D tracking.

    // Material tuning
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
        if (!mat.opacity || mat.opacity >= 1) mat.opacity = 0.5
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
  }, [])

  // ─── Initialise AR (camera + Three.js + FaceMesh) ───────────────────────
  const initAR = useCallback(async (initialEntry: GlassesEntry) => {
    if (!videoRef.current || !canvasRef.current || initRef.current) return
    initRef.current = true

    const video  = videoRef.current
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d', { willReadFrequently: true })!

    // ── Camera stream ──────────────────────────────────────────────────────
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      if (!containerRef.current) { stream.getTracks().forEach(t => t.stop()); return }
      video.srcObject = stream
      await new Promise<void>(res => { video.onloadedmetadata = () => res() })
      await video.play().catch(e => console.warn('[AR] play:', e))
    } catch (e: any) {
      console.error('[AR] camera:', e)
      initRef.current = false
      setErrMsg(
        e.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access and reload.' :
        e.name === 'NotFoundError'   ? 'No camera found on this device.' :
        `Camera error: ${e.message}`
      )
      setStatus('error')
      return
    }

    // ── Canvas size = camera resolution ────────────────────────────────────
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720
    const W = canvas.width, H = canvas.height
    const halfW = W / 2, halfH = H / 2

    // ── Three.js — 1 unit = 1 pixel orthographic ───────────────────────────
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
    renderer.shadowMap.enabled = false
    rendererRef.current = renderer

    // ── Lighting ───────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.2))
    const key = new THREE.DirectionalLight(0xffffff, 0.8)
    key.position.set(2, 4, 6); scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.4)
    fill.position.set(-2, 0, 3); scene.add(fill)
    const rimL = new THREE.DirectionalLight(0xffffff, 0.25)
    rimL.position.set(-4, 2, -3); scene.add(rimL)

    // ── Face depth occluder ────────────────────────────────────────────────
    // Depth-only ellipse mesh that writes to depth buffer so temple arms
    // that fall "behind" the face are correctly occluded — same technique
    // used by Snapchat / Fittingbox for temple occlusion.
    const occShape = new THREE.Shape()
    occShape.absellipse(0, 0, 1, 1, 0, Math.PI * 2, false, 0)
    const occGeo = new THREE.ShapeGeometry(occShape, 48)
    const occMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    const occluder = new THREE.Mesh(occGeo, occMat)
    occluder.renderOrder = 0   // writes depth first
    occluder.visible = false
    scene.add(occluder)
    occluderRef.current = occluder

    // ── Load initial model ─────────────────────────────────────────────────
    try {
      await loadGlassesModel(initialEntry)
    } catch (e: any) {
      console.error('[AR] model:', e)
      setErrMsg('Failed to load glasses model. Please try again.')
      setStatus('error')
      initRef.current = false
      return
    }

    // ── MediaPipe FaceMesh ─────────────────────────────────────────────────
    const fm = new FaceMesh({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    })
    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,       // adds iris landmarks 468-477
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.45,
    })
    faceMeshRef.current = fm

    // ── Per-frame result handler ───────────────────────────────────────────
    fm.onResults(results => {
      busyRef.current = false

      // Draw raw (unflipped) video — CSS scaleX(-1) on canvas provides the mirror.
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(results.image, 0, 0, W, H)

      const lms = results.multiFaceLandmarks?.[0]
      if (!lms) {
        if (mountedRef.current) setFaceLive(false)
        if (glassesRef.current) glassesRef.current.visible = false
        if (occluderRef.current) occluderRef.current.visible = false
        if (rendererRef.current && sceneRef.current && cameraRef.current)
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0)
        return
      }
      if (mountedRef.current) setFaceLive(true)

      // Raw pixel coords — no 1-lm.x inversion (CSS mirror handles visual flip)
      const px = (l: { x: number }) => l.x * W
      const py = (l: { y: number }) => l.y * H

      // ── Iris centres (most stable X source for horizontal anchor) ────────
      const liX = px(lms[468] ?? lms[133])
      const riX = px(lms[473] ?? lms[362])

      // ── Iris Y for vertical anchor (eye-level placement) ─────────────────
      // lms[468] / lms[473] include iris — their Y ≈ pupil center Y.
      const lirisY = py(lms[468] ?? lms[159])
      const ririsY = py(lms[473] ?? lms[386])
      const pupilY = (lirisY + ririsY) / 2

      // ── Outer eye corners (for roll + eye-span scale) ─────────────────────
      const loX = px(lms[33]),  loY = py(lms[33])
      const roX = px(lms[263]), roY = py(lms[263])

      // ── Inner eye corners (roll stability) ──────────────────────────────
      const liInX = px(lms[133]), liInY = py(lms[133])
      const riInX = px(lms[362]), riInY = py(lms[362])

      // ── Temple landmarks (true glasses-width span) ───────────────────────
      const ltX = px(lms[127]), ltY = py(lms[127])
      const rtX = px(lms[356]), rtY = py(lms[356])

      // ── Face edge for occluder ────────────────────────────────────────────
      const fEarLX = px(lms[234]), fEarLY = py(lms[234])
      const fEarRX = px(lms[454]), fEarRY = py(lms[454])
      const fTopY  = py(lms[10])
      const fBotY  = py(lms[152])

      // ── Nose landmarks for yaw/pitch ─────────────────────────────────────
      const noseTipX = px(lms[1])
      const noseTipY = py(lms[1])
      const nbY      = py(lms[168])   // nose bridge
      const gbY      = py(lms[6])     // glabella

      // ────── MEASUREMENTS ──────────────────────────────────────────────────

      // 1. Scale: blend outer-eye span with temple span for robust sizing.
      //    Outer-eye span controls lens area; temple span provides frame width.
      const outerEyeSpan = Math.hypot(roX - loX, roY - loY)
      const templeSpan   = Math.hypot(rtX - ltX, rtY - ltY)
      // Glasses real-world width ≈ 110% of outer-eye span (extends slightly past corners)
      const targetSpanPx = outerEyeSpan * 1.12 * 0.5 + templeSpan * 0.5

      // 2. HEAD ROLL — average inner + outer corner vectors for stability
      const rollA = Math.atan2(roY - loY, roX - loX)
      const rollB = Math.atan2(riInY - liInY, riInX - liInX)
      const rollTarget = (rollA + rollB) / 2

      // 3. HEAD YAW — how far nose tip is offset from the mid-point between ear edges
      //    Positive raw yaw → nose shifted right in raw image → face turned to user's left
      //    (after CSS mirror, viewer sees face turning their right)
      const faceCtrX  = (fEarLX + fEarRX) / 2
      const halfFaceW = (fEarRX - fEarLX) / 2
      const yawNorm   = (noseTipX - faceCtrX) / (halfFaceW || 1)
      const yawTarget = Math.max(-1, Math.min(1, yawNorm)) * (Math.PI / 2.2)

      // 4. HEAD PITCH — nose tip vertical offset from face vertical midpoint
      const faceCtrY  = (fTopY + fBotY) / 2
      const halfFaceH = (fBotY - fTopY) / 2
      const pitchNorm = (noseTipY - faceCtrY) / (halfFaceH || 1)
      const pitchTarget = Math.max(-0.8, Math.min(0.8, pitchNorm)) * (Math.PI / 5)

      // ────── SMOOTH ALL TRACKED VALUES ─────────────────────────────────────
      const POS_LERP   = 0.35   // fast position tracking
      const SCALE_LERP = 0.12   // slow scale — prevents "incoming" zoom effect
      const ROT_LERP   = 0.28

      const sf = (targetSpanPx / (modelWRef.current || 1)) * userScaleRef.current
      sfSmoothedRef.current = lp(sfSmoothedRef.current, sf, SCALE_LERP)

      // ── THREE ortho coords: canvas centre = origin, +x right, +y UP ──────
      // Anchor at eye level: weight pupil Y heavily, lean slightly toward
      // nose bridge for natural positioning (glasses sit on nose, over eyes).
      const anchorYImg = pupilY * 0.65 + (nbY + gbY) / 2 * 0.35
      const posX = (liX + riX) / 2 - halfW
      const posY = -(anchorYImg - halfH) + (activeEntryRef.current?.offsetY ?? 0)

      posSmoothedRef.current.x = lp(posSmoothedRef.current.x, posX, POS_LERP)
      posSmoothedRef.current.y = lp(posSmoothedRef.current.y, posY, POS_LERP)

      rollSmRef.current  = lp(rollSmRef.current,  rollTarget,  ROT_LERP)
      yawSmRef.current   = lp(yawSmRef.current,   yawTarget,   ROT_LERP)
      pitchSmRef.current = lp(pitchSmRef.current, pitchTarget, ROT_LERP)

      // ────── FACE OCCLUDER ──────────────────────────────────────────────────
      // An invisible ellipse at z = -0.65 * scaled depth that writes only to
      // depth buffer.  Glasses geometry that falls behind this plane is culled,
      // so temple arms appear to pass behind the face and behind the ears.
      // When the face turns (yaw ≠ 0) the occluder automatically shifts with
      // the face centre so the near temple stays visible.
      if (occluderRef.current) {
        const scaledDepth = sfSmoothedRef.current * modelDRef.current
        // Face centre in THREE ortho space
        const faceCX = faceCtrX - halfW
        const faceCY = -((fEarLY + fEarRY) / 2 - halfH)
        // Occluder semi-axes: face half-width + padding, face half-height
        const faceHW = halfFaceW * 1.05
        const faceHH = Math.abs(fBotY - fTopY) * 0.52
        occluderRef.current.position.set(faceCX, faceCY, -scaledDepth * 0.65)
        occluderRef.current.scale.set(faceHW, faceHH, 1)
        occluderRef.current.rotation.z = -rollSmRef.current
        occluderRef.current.visible = true
      }

      // ────── APPLY TO GLASSES GROUP ────────────────────────────────────────
      const glasses = glassesRef.current
      if (!glasses) {
        rendererRef.current?.render(sceneRef.current!, cameraRef.current!)
        ctx.drawImage(offscreenRef.current!, 0, 0)
        return
      }

      const sfFinal = sfSmoothedRef.current

      glasses.position.copy(posSmoothedRef.current)
      glasses.scale.set(sfFinal, sfFinal, sfFinal)

      // Full 3D rotation:
      //   roll  → Z axis (head lean left/right)
      //   pitch → X axis (head tilt up/down)
      //   yaw   → Y axis (head turn left/right) + Math.PI to face camera
      // Euler order YXZ is natural for head rotation.
      glasses.rotation.order = 'YXZ'
      glasses.rotation.y = Math.PI + yawSmRef.current
      glasses.rotation.x = pitchSmRef.current
      glasses.rotation.z = -rollSmRef.current

      glasses.visible = true

      // Composite
      if (rendererRef.current && sceneRef.current && cameraRef.current)
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0)
    })

    // ── Frame loop ─────────────────────────────────────────────────────────
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

    if (mountedRef.current) setStatus('running')

    // Edge-case: user may have switched the carousel during initialisation.
    // Now that everything is ready, load the actually-desired model if it differs
    // from the one loaded during startup.
    const desired = GLASSES_CATALOGUE[selectedIdxRef.current]
    if (desired.id !== (activeEntryRef.current?.id ?? '')) {
      loadGlassesModel(desired).catch(console.error)
    }
  }, [loadGlassesModel])

  // ─── Init on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    const entry = GLASSES_CATALOGUE[selectedIdx]
    initAR(entry)
    return () => stopAR()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // run once on mount

  // ─── Swap model when user picks another style ─────────────────────────────
  useEffect(() => {
    const entry = GLASSES_CATALOGUE[selectedIdx]
    if (activeEntryRef.current?.id === entry.id) return
    if (!sceneRef.current) return   // AR not yet initialised
    // Hide while loading new model
    if (glassesRef.current) glassesRef.current.visible = false
    loadGlassesModel(entry).catch(e => console.error('[AR] swap model:', e))
  }, [selectedIdx, loadGlassesModel])

  // ─── Screenshot ───────────────────────────────────────────────────────────
  const capture = useCallback(() => {
    const src = canvasRef.current
    if (!src) return
    const tmp = document.createElement('canvas')
    tmp.width = src.width; tmp.height = src.height
    const tc = tmp.getContext('2d')!
    tc.translate(src.width, 0); tc.scale(-1, 1)   // apply the CSS mirror to export
    tc.drawImage(src, 0, 0)
    setCaptured(tmp.toDataURL('image/png'))
  }, [])

  return (
    <main className="eyewear-tryon-root" style={{
      position: 'fixed', inset: 0, background: '#000', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
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

        {/* Face-tracked badge */}
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
          {faceLive ? 'Face tracked' : 'Searching…'}
        </motion.div>
      </header>

      {/* ── Camera viewport ──────────────────────────────────────────────── */}
      <div ref={containerRef} style={{
        flex: 1, position: 'relative', overflow: 'hidden',
      }}>
        {/* Hidden video source */}
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

        {/*
          Mirror canvas: CSS scaleX(-1) is the key.
          Both the 2D video pixels AND the Three.js glasses pixels are in raw
          (unflipped) coordinates and CSS-mirrored together — so glasses always
          appear on the correct side even as the head turns.
        */}
        <canvas
          ref={canvasRef}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: 'scaleX(-1)',
            display: status === 'error' || status === 'loading' ? 'none' : 'block',
          }}
        />

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
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                Initialising AR camera…
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                Allow camera access when prompted
              </p>
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

        {/* Face guide ellipse — shown until face is detected */}
        <AnimatePresence>
          {status === 'running' && !faceLive && (
            <motion.div
              key="guide"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <svg width="220" height="300" viewBox="0 0 220 300" fill="none"
                style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))' }}>
                <ellipse cx="110" cy="150" rx="95" ry="133" stroke="rgba(212,175,55,0.55)"
                  strokeWidth="1.8" strokeDasharray="7 5"/>
                {/* corner brackets */}
                <path d="M35 22 L15 22 L15 58"  stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M185 22 L205 22 L205 58" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M35 278 L15 278 L15 242" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M185 278 L205 278 L205 242" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <div style={{
                position: 'absolute', bottom: '18%',
                color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500,
                textShadow: '0 1px 6px rgba(0,0,0,0.6)',
                letterSpacing: '0.06em',
              }}>
                Position your face in the frame
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom panel — model picker + shutter (like image 2) ─────────── */}
      <AnimatePresence>
        {(status === 'running' || status === 'loading') && (
          <motion.div
            key="bottom"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            style={{
              position: 'relative', zIndex: 40,
              background: 'rgba(10,10,10,0.88)',
              backdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              padding: '14px 20px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
          >
            {/* Size scrubber */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 300,
            }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: '0.08em', width: 32 }}>SIZE</span>
              <button
                onClick={() => setUserScale(s => parseFloat(Math.max(0.6, s - 0.05).toFixed(2)))}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent', color: 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 18, lineHeight: 1,
                }}
              >−</button>
              <input
                type="range" min={0.6} max={1.5} step={0.01}
                value={userScale}
                onChange={e => setUserScale(parseFloat(e.target.value))}
                style={{
                  flex: 1, height: 4, accentColor: '#D4AF37', cursor: 'pointer',
                  background: `linear-gradient(to right, #D4AF37 ${((userScale - 0.6) / 0.9) * 100}%, rgba(255,255,255,0.1) 0%)`,
                  borderRadius: 99, outline: 'none',
                }}
              />
              <button
                onClick={() => setUserScale(s => parseFloat(Math.min(1.5, s + 0.05).toFixed(2)))}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent', color: 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 18, lineHeight: 1,
                }}
              >+</button>
              <span style={{ color: '#D4AF37', fontSize: 11, width: 32, textAlign: 'right' }}>
                {Math.round(userScale * 100)}%
              </span>
            </div>

            {/* Glasses carousel + shutter */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, width: '100%',
            }}>
              {/* Model circles */}
              {GLASSES_CATALOGUE.map((g, idx) => {
                const isActive = idx === selectedIdx
                return (
                  <motion.button
                    key={g.id}
                    onClick={() => setSelectedIdx(idx)}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      width: 58, height: 58, borderRadius: '50%',
                      border: isActive
                        ? '2px solid #D4AF37'
                        : '2px solid rgba(255,255,255,0.2)',
                      background: isActive
                        ? 'rgba(212,175,55,0.12)'
                        : 'rgba(255,255,255,0.06)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', gap: 2, padding: '8px 10px',
                      color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.55)',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                    title={g.name}
                  >
                    {CAROUSEL_ICONS[g.id] ?? (
                      <svg viewBox="0 0 64 26" fill="none" className="w-full h-full">
                        <ellipse cx="16" cy="13" rx="14" ry="9" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
                        <ellipse cx="48" cy="13" rx="14" ry="9" stroke="currentColor" strokeWidth="2.5" fill="rgba(255,255,255,0.08)"/>
                        <path d="M30 10 Q32 8 34 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      </svg>
                    )}
                  </motion.button>
                )
              })}

              {/* Shutter button — centred between the models */}
              <motion.button
                onClick={capture}
                disabled={status !== 'running' || !faceLive}
                whileTap={{ scale: 0.88 }}
                style={{
                  width: 66, height: 66, borderRadius: '50%',
                  border: '2.5px solid rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
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
            <div style={{
              display: 'flex', gap: 12, justifyContent: 'center',
            }}>
              {GLASSES_CATALOGUE.map((g, idx) => (
                <span key={g.id} style={{
                  fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: idx === selectedIdx ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                  transition: 'color 0.2s', width: 58, textAlign: 'center',
                }}>
                  {g.name}
                </span>
              ))}
              {/* Spacer to match shutter button */}
              <span style={{ width: 66 }}/>
            </div>

            {/* Tip row */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[['💡','Good lighting'],['📱','Eye level'],['👤','Face forward'],['↩️','Turn to see temples']].map(([ic, tip]) => (
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

      {/* ── Screenshot preview overlay ───────────────────────────────────── */}
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
                  a.download = `eyewear-${Date.now()}.png`; a.href = captured; a.click()
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
                onClick={() => setCaptured(null)}
                style={{
                  padding: '9px 20px', borderRadius: 99,
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer',
                  background: 'transparent',
                }}
              >Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Keyframe animations ──────────────────────────────────────────── */}
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes blink { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
      `}</style>
    </main>
  )
}

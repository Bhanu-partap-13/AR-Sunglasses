declare module 'mind-ar/dist/mindar-face-three.prod.js' {
  import * as THREE from 'three'

  export interface MindARThreeOptions {
    container: HTMLElement
    filterMinCF?: number
    filterBeta?: number
    uiLoading?: string
    uiScanning?: string
    uiError?: string
  }

  export interface MindARAnchor {
    group: THREE.Group
    onTargetFound?: () => void
    onTargetLost?: () => void
  }

  export class MindARThree {
    constructor(options: MindARThreeOptions)
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.Camera
    start(): Promise<void>
    stop(): void
    addAnchor(anchorIndex: number): MindARAnchor
    addFaceMesh?(): THREE.Mesh | null
  }
}

// Global window extensions for MindAR cache
declare global {
  interface Window {
    __mindARCache?: {
      THREE: typeof import('three')
      GLTFLoader: any
      MindARThree: typeof import('mind-ar/dist/mindar-face-three.prod.js').MindARThree
    }
  }
}

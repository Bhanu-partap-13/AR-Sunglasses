declare module '@mediapipe/face_mesh' {
  export interface FaceMeshConfig {
    locateFile?: (file: string) => string
  }

  export interface NormalizedLandmark {
    x: number
    y: number
    z: number
  }

  export interface FaceMeshResults {
    multiFaceLandmarks?: NormalizedLandmark[][]
    image: HTMLCanvasElement | HTMLVideoElement | ImageBitmap
  }

  export class FaceMesh {
    constructor(config?: FaceMeshConfig)
    setOptions(options: {
      maxNumFaces?: number
      refineLandmarks?: boolean
      minDetectionConfidence?: number
      minTrackingConfidence?: number
    }): void
    onResults(callback: (results: FaceMeshResults) => void): void
    send(inputs: { image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement }): Promise<void>
    close(): void
  }
}

declare module '@mediapipe/camera_utils' {
  export interface CameraConfig {
    onFrame: () => Promise<void>
    width?: number
    height?: number
    facingMode?: 'user' | 'environment'
  }

  export class Camera {
    constructor(videoElement: HTMLVideoElement, config: CameraConfig)
    start(): Promise<void>
    stop(): void
  }
}

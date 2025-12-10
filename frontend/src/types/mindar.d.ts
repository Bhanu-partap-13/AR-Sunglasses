declare module 'mind-ar/dist/mindar-face-three.prod.js' {
  import { Scene, Camera, WebGLRenderer, Group } from 'three'
  
  export interface MindARThreeOptions {
    container: HTMLElement
  }
  
  export interface Anchor {
    group: Group
  }
  
  export class MindARThree {
    renderer: WebGLRenderer
    scene: Scene
    camera: Camera
    
    constructor(options: MindARThreeOptions)
    addAnchor(index: number): Anchor
    start(): Promise<void>
    stop(): void
  }
}

declare module "three/examples/jsm/controls/OrbitControls" {
  import { Camera, EventDispatcher, Vector3 } from "three"
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement)
    enabled: boolean
    enableDamping: boolean
    target: Vector3
    update(): void
    dispose(): void
  }
}

declare module "three/examples/jsm/loaders/GLTFLoader" {
  import { Loader, Group } from "three"
  export interface GLTF {
    scene: Group
    scenes: Group[]
    animations: unknown[]
    asset: unknown
    parser: unknown
    userData: unknown
  }
  export class GLTFLoader extends Loader {
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void
    setResourcePath(path: string): this
  }
}

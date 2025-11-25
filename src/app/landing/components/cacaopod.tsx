"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Box3, Vector3, Color, SRGBColorSpace, Group } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader"

export interface CacaoPodHandle {
  model: Group | null
}

const CacaoPod = forwardRef<CacaoPodHandle, { className?: string }>(({ className }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<Group | null>(null)

  useImperativeHandle(ref, () => ({
    get model() {
      return modelRef.current
    }
  }))

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight || 500

    const renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.outputColorSpace = SRGBColorSpace
    renderer.setClearColor(0x000000, 0) // Transparent background
    container.appendChild(renderer.domElement)

    const scene = new Scene()
    // scene.background = new Color(0xffffff) // Removed for transparency

    const camera = new PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, 5) // Start further back, centered

    const ambient = new AmbientLight(0xffffff, 0.8)
    scene.add(ambient)

    const dir = new DirectionalLight(0xffffff, 1)
    dir.position.set(2, 2, 2)
    scene.add(dir)

    let loadedModel: Group | null = null

    const updateCamera = () => {
      if (!loadedModel || !container) return

      const box = new Box3().setFromObject(loadedModel)
      const size = box.getSize(new Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = camera.fov * (Math.PI / 180)

      // Calculate distance to fit vertically
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))

      // Apply padding factor (1.5 = comfortable fit, not too huge)
      cameraZ *= 1.6

      // Adjust for aspect ratio (fit horizontally if needed)
      const aspect = camera.aspect
      if (aspect < 1) {
        cameraZ /= aspect
      }

      camera.position.set(0, 0, cameraZ)
      camera.lookAt(0, 0, 0)
    }

    const loader = new GLTFLoader()
    loader.setResourcePath("/_model/cacao_pod/textures/")
    loader.load(
      "/_model/cacao_pod/source/cocoabean%20Scan.glb",
      (gltf: GLTF) => {
        const model = gltf.scene
        loadedModel = model // Save reference

        // Create a wrapper group to handle rotation pivot
        const wrapper = new Group()
        scene.add(wrapper)
        wrapper.add(model)

        // Expose the wrapper instead of the raw model
        modelRef.current = wrapper

        // Set initial orientation on the MODEL (inner rotation)
        model.rotation.z = Math.PI / 2 // 90 degrees vertical
        model.rotation.x = 0

        const box = new Box3().setFromObject(model)
        const center = box.getCenter(new Vector3())

        // Center the model within the wrapper
        model.position.sub(center)

        // Initial camera setup
        updateCamera()
      }
    )

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          const { width, height } = entry.contentRect
          renderer.setSize(width, height)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          updateCamera()
        }
      }
    })
    resizeObserver.observe(container)

    let frame = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(frame)
      renderer.dispose()
      while (scene.children.length > 0) {
        scene.remove(scene.children[0])
      }
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className={`w-full h-[500px] pointer-events-none ${className}`} />
})

CacaoPod.displayName = "CacaoPod"
export default CacaoPod

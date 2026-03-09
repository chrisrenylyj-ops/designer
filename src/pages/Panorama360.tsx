import { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'

const uploadIcon = (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" className="shrink-0">
    <path d="M42 27C42 33 38 43 24 43C10 43 6 33 6 27" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24.0078 5.10059V33.0001" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17L24 5L36 17" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function isImageFile(f: File) {
  return IMAGE_TYPES.includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name)
}

export default function Panorama360() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; mesh: THREE.Mesh; controls: { yaw: number; pitch: number } } | null>(null)
  const rafRef = useRef<number>(0)
  const cleanupRef = useRef<(() => void) | null>(null)

  const setupScene = useCallback((textureUrl: string): (() => void) => {
    if (!containerRef.current) return
    const width = containerRef.current.offsetWidth
    const height = containerRef.current.offsetHeight
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0xf8fafc)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(renderer.domElement)
    renderer.domElement.style.cursor = 'grab'
    renderer.domElement.style.background = '#f8fafc'

    const geometry = new THREE.SphereGeometry(500, 96, 64)
    geometry.scale(-1, 1, 1)
    const loader = new THREE.TextureLoader()
    const texture = loader.load(textureUrl)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
    const material = new THREE.MeshBasicMaterial({ map: texture })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    camera.position.set(0, 0, 0.1)

    // 默认朝向全景图画面中心（正前方），yaw = 90°
    const controls = { yaw: Math.PI / 2, pitch: 0 }
    let isDown = false
    let prevX = 0
    let prevY = 0

    const onPointerDown = (e: PointerEvent) => {
      isDown = true
      renderer.domElement.style.cursor = 'grabbing'
      prevX = e.clientX
      prevY = e.clientY
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return
      controls.yaw += (e.clientX - prevX) * 0.003
      controls.pitch += (e.clientY - prevY) * 0.003
      controls.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, controls.pitch))
      prevX = e.clientX
      prevY = e.clientY
    }
    const onPointerUp = () => {
      isDown = false
      renderer.domElement.style.cursor = 'grab'
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    sceneRef.current = { scene, camera, renderer, mesh, controls }

    const onResize = () => {
      if (!containerRef.current || !sceneRef.current) return
      const w = containerRef.current.offsetWidth
      const h = containerRef.current.offsetHeight
      sceneRef.current.camera.aspect = w / h
      sceneRef.current.camera.updateProjectionMatrix()
      sceneRef.current.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      sceneRef.current.renderer.setSize(w, h)
    }
    document.addEventListener('fullscreenchange', onResize)
    window.addEventListener('resize', onResize)

    function animate() {
      rafRef.current = requestAnimationFrame(animate)
      if (!sceneRef.current) return
      const { camera, renderer, controls } = sceneRef.current
      camera.rotation.order = 'YXZ'
      camera.rotation.y = controls.yaw
      camera.rotation.x = controls.pitch
      renderer.render(scene, camera)
    }
    animate()
    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('fullscreenchange', onResize)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      texture.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      sceneRef.current = null
    }
  }, [])

  const handleFile = useCallback((f: File) => {
    cleanupRef.current?.()
    cleanupRef.current = null
    setFile(f)
  }, [])

  // Run setup after container height transition (350ms) so canvas is created at final size — avoids black flash + cutting
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const timer = setTimeout(() => {
      if (!containerRef.current) {
        URL.revokeObjectURL(url)
        return
      }
      cleanupRef.current = setupScene(url)
    }, 350)
    return () => {
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [file, setupScene])

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
      if (sceneRef.current) {
        cancelAnimationFrame(rafRef.current)
        sceneRef.current.renderer.dispose()
        sceneRef.current = null
      }
    }
  }, [])

  const zoomIn = () => {
    if (!sceneRef.current) return
    const { camera } = sceneRef.current
    if (camera.fov > 10) {
      camera.fov -= 5
      camera.updateProjectionMatrix()
    }
  }
  const zoomOut = () => {
    if (!sceneRef.current) return
    const { camera } = sceneRef.current
    if (camera.fov < 120) {
      camera.fov += 5
      camera.updateProjectionMatrix()
    }
  }
  const resetView = () => {
    if (sceneRef.current) {
      sceneRef.current.controls.yaw = Math.PI / 2
      sceneRef.current.controls.pitch = 0
    }
  }
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f && isImageFile(f)) handleFile(f)
  }

  return (
    <div className="w-full -mx-[176px] flex flex-col items-center">
      <div className={`relative bg-card-bg rounded-[48px] overflow-hidden w-full max-w-[976px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-[box-shadow,height] duration-300 ${file ? 'h-[560px]' : 'h-[400px]'}`}>
        {!file ? (
          <div
            className={`group absolute inset-0 h-full min-h-[400px] bg-white flex flex-col gap-6 items-center justify-center p-8 transition-colors ${
              isDragging ? 'bg-primary/5' : ''
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="flex flex-col gap-3 items-center">
              <div className="pb-2">
                <div className="bg-white border border-border flex items-center justify-center rounded-full size-16 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-300 ease-out group-hover:scale-110 group-hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]">
                  {uploadIcon}
                </div>
              </div>
              <h3 className="font-bold text-[20px] text-primary text-center">Drop 360° Image</h3>
              <p className="text-[14px] text-muted text-center max-w-[320px] leading-[22.75px]">
                Drag and drop your panorama file here to<br />
                preview it in a fully interactive 360°<br />
                environment.
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                  e.target.value = ''
                }}
              />
              <span className="bg-primary flex items-center justify-center px-8 py-2.5 rounded-full text-[14px] font-bold text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                Select File
              </span>
            </label>
          </div>
        ) : (
          <>
            <div ref={containerRef} className="absolute inset-0 w-full h-full bg-[#f8fafc]" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-[20px] backdrop-saturate-[180%] bg-white/40 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex gap-2 items-center p-[7px] rounded-full">
              <button type="button" onClick={zoomIn} className="rounded-full size-10 flex items-center justify-center hover:bg-white/20" aria-label="Zoom in">
                <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                  <path d="M21 38C30.3888 38 38 30.3888 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 30.3888 11.6112 38 21 38Z" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinejoin="round"/>
                  <path d="M21 15L21 27" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.0156 21.0156L27 21" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M33.2216 33.2217L41.7069 41.707" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="w-px h-4 bg-white/80" />
              <button type="button" onClick={zoomOut} className="rounded-full size-10 flex items-center justify-center hover:bg-white/20" aria-label="Zoom out">
                <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                  <path d="M21 38C30.3888 38 38 30.3888 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 30.3888 11.6112 38 21 38Z" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinejoin="round"/>
                  <path d="M15 21L27 21" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M33.2216 33.2217L41.7069 41.707" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="w-px h-4 bg-white/80" />
              <button type="button" onClick={resetView} className="rounded-full size-10 flex items-center justify-center hover:bg-white/20" aria-label="Reset view">
                <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                  <path d="M36.7279 36.7279C33.4706 39.9853 28.9706 42 24 42C14.0589 42 6 33.9411 6 24C6 14.0589 14.0589 6 24 6C28.9706 6 33.4706 8.01472 36.7279 11.2721C38.3859 12.9301 42 17 42 17" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M42 8V17H33" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="w-px h-4 bg-white/80" />
              <button type="button" onClick={toggleFullscreen} className="rounded-full size-10 flex items-center justify-center hover:bg-white/20" aria-label="Fullscreen">
                <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                  <path d="M33 6H42V15" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M42 33V42H33" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 42H6V33" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 15V6H15" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

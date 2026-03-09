import { useState, useCallback, useEffect, useRef } from 'react'
import DropZone from '../components/DropZone'

const ESTIMATE_DEBOUNCE_MS = 300

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_MB = 20

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function compressImage(file: File, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        quality / 100
      )
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function Compress() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(80)
  const [compressing, setCompressing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressedSize, setCompressedSize] = useState<number | null>(null)
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null)
  const [estimating, setEstimating] = useState(false)
  const estimateVersionRef = useRef(0)

  const handleSelect = useCallback((f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setCompressedSize(null)
    setEstimatedSize(null)
  }, [previewUrl])

  // 滑动质量时防抖计算并展示对应压缩大小
  useEffect(() => {
    if (!file) {
      setEstimatedSize(null)
      return
    }
    const version = ++estimateVersionRef.current
    setEstimating(true)
    const t = setTimeout(async () => {
      try {
        const blob = await compressImage(file, quality)
        if (version === estimateVersionRef.current) {
          setEstimatedSize(blob.size)
        }
      } catch {
        if (version === estimateVersionRef.current) setEstimatedSize(null)
      } finally {
        if (version === estimateVersionRef.current) setEstimating(false)
      }
    }, ESTIMATE_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [file, quality])

  const handleCompress = async () => {
    if (!file) return
    setCompressing(true)
    try {
      const blob = await compressImage(file, quality)
      setCompressedSize(blob.size)
      setEstimatedSize(blob.size)
      const name = file.name.replace(/\.[^.]+$/, '') + '-compressed.jpg'
      downloadBlob(blob, name)
    } finally {
      setCompressing(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <DropZone
        title="Drag and drop your image here"
        subtitle={`Support for JPEG, PNG and WebP files up to ${MAX_MB}MB`}
        accept={ACCEPT}
        maxSize={MAX_MB * 1024 * 1024}
        onSelect={handleSelect}
        previewUrl={previewUrl}
      />
      {file && (
        <div className="flex flex-col items-start pt-[20px] w-full">
          <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[14px] text-muted">
              <span>Original: <strong className="text-primary font-semibold">{formatSize(file.size)}</strong></span>
              {(estimatedSize !== null || estimating) && (
                <span>
                  {estimating ? (
                    'Calculating…'
                  ) : (
                    <>Compressed: <strong className="text-primary font-semibold">{formatSize(estimatedSize ?? 0)}</strong></>
                  )}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center justify-between w-full">
                <span className="text-[12px] font-semibold text-[#475569] tracking-[0.7px] uppercase">Quality</span>
                <div className="bg-muted-bg px-3 py-1 rounded-full">
                  <span className="font-bold text-[12px] text-primary">{quality}%</span>
                </div>
              </div>
              <div className="relative h-[3px] bg-border rounded-full w-full">
                <div
                  className="absolute inset-y-0 left-0 h-[3px] bg-primary rounded-full"
                  style={{ width: `${quality}%` }}
                />
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="absolute inset-0 w-full h-[3px] opacity-0 cursor-pointer"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-primary rounded-full pointer-events-none"
                  style={{ left: `calc(${quality}% - 10px)` }}
                />
              </div>
            </div>
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleCompress}
                disabled={compressing}
                className="bg-primary px-8 py-2.5 rounded-full font-bold text-[14px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] disabled:opacity-60"
              >
                {compressing ? 'Compressing…' : 'Compress Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

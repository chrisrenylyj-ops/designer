import { useState, useCallback, useEffect, useRef } from 'react'
import DropZone from '../components/DropZone'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_MB = 20

type Item = { file: File; previewUrl: string }

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
  const [item, setItem] = useState<Item | null>(null)
  const [quality, setQuality] = useState(80)
  const [compressing, setCompressing] = useState(false)

  const previewRef = useRef<string | null>(null)
  previewRef.current = item?.previewUrl ?? null

  const handleSelect = useCallback((file: File) => {
    setItem((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return { file, previewUrl: URL.createObjectURL(file) }
    })
  }, [])

  useEffect(() => () => {
    const url = previewRef.current
    if (url) URL.revokeObjectURL(url)
  }, [])

  const handleCompress = async () => {
    if (!item) return
    setCompressing(true)
    try {
      const blob = await compressImage(item.file, quality)
      const name = item.file.name.replace(/\.[^.]+$/, '') + '-compressed.jpg'
      downloadBlob(blob, name)
    } finally {
      setCompressing(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-[16px] w-full">
      <div className="w-full max-w-[800px]">
        <DropZone
          title="Drag and drop your image here"
          subtitle={item ? '1 image selected — select again to replace' : `Support for JPEG, PNG and WebP files up to ${MAX_MB}MB`}
          accept={ACCEPT}
          maxSize={MAX_MB * 1024 * 1024}
          onSelect={handleSelect}
          previewUrl={item?.previewUrl ?? null}
        />
      </div>
      {item && (
        <div className="flex flex-col items-center gap-5 pt-[10px] w-full">
          <div className="flex flex-col gap-4 w-full max-w-[800px]">
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
          <div className="w-full flex justify-center pt-[32px]">
            <div className="pt-[16px]">
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

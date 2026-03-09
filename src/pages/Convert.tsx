import { useState, useCallback, useEffect, useRef } from 'react'
import DropZone from '../components/DropZone'

type Format = 'JPG' | 'PNG' | 'WebP' | 'AVIF'
const FORMATS: Format[] = ['JPG', 'PNG', 'WebP', 'AVIF']

function convertImage(file: File, format: Format): Promise<Blob> {
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
      const mime = format === 'JPG' ? 'image/jpeg' : format === 'PNG' ? 'image/png' : format === 'WebP' ? 'image/webp' : 'image/avif'
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        mime,
        0.92
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

export default function Convert() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [format, setFormat] = useState<Format>('JPG')
  const [converting, setConverting] = useState(false)

  const previewRef = useRef<string | null>(null)
  previewRef.current = previewUrl

  const handleSelect = useCallback((f: File) => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(f)
    })
    setFile(f)
  }, [])

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  const handleConvert = async () => {
    if (!file) return
    setConverting(true)
    try {
      const blob = await convertImage(file, format)
      const ext = format === 'JPG' ? 'jpg' : format.toLowerCase()
      const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext
      downloadBlob(blob, name)
    } catch {
      if (format === 'AVIF') {
        try {
          const blob = await convertImage(file, 'WebP')
          downloadBlob(blob, file.name.replace(/\.[^.]+$/, '') + '.webp')
        } catch {}
        alert('AVIF may not be supported in this browser. Try WebP.')
      }
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-[16px] w-full">
      <DropZone
        title="Drag and drop your image here"
        subtitle="Support for JPEG, PNG and WebP files up to 20MB"
        onSelect={handleSelect}
        previewUrl={previewUrl}
      />
      {file && (
        <div className="flex flex-col items-center pt-[10px] w-full">
          <div className="flex justify-center w-full">
            <div className="max-w-[512px] w-full shrink-0">
              <div className="flex gap-[16px] h-[40px] items-center w-full">
                {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`flex-1 flex items-center justify-center self-stretch min-w-0 rounded-[999px] p-[18px] text-[14px] font-bold border-2 border-solid leading-[20px] transition-colors ${
                    format === f
                      ? 'bg-[#f8fafc] border-[#0f172a] text-[#0f172a]'
                      : 'bg-white border-[#f1f5f9] text-[#0f172a] hover:border-[#e2e8f0]'
                  }`}
                >
                  {f}
                </button>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full flex justify-center pt-[32px]">
            <div className="pt-[16px]">
              <button
                type="button"
                onClick={handleConvert}
                disabled={converting}
                className="bg-primary px-8 py-2.5 rounded-full font-bold text-[14px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] disabled:opacity-60"
              >
                {converting ? 'Converting…' : 'Convert Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

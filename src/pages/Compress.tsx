import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import DropZone from '../components/DropZone'

const ESTIMATE_DEBOUNCE_MS = 300

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_MB = 20

type Item = { id: string; file: File; previewUrl: string }

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
  const [items, setItems] = useState<Item[]>([])
  const [quality, setQuality] = useState(80)
  const [compressing, setCompressing] = useState<{ running: boolean; done: number; total: number }>({ running: false, done: 0, total: 0 })
  const [estimatedTotalSize, setEstimatedTotalSize] = useState<number | null>(null)
  const [estimating, setEstimating] = useState(false)
  const estimateVersionRef = useRef(0)

  const previewRef = useRef<string[]>([])
  previewRef.current = items.map((i) => i.previewUrl)

  const previewUrl = items[0]?.previewUrl ?? null
  const total = items.length

  const originalTotalSize = useMemo(() => items.reduce((sum, it) => sum + it.file.size, 0), [items])

  const toItems = useCallback((files: File[]) => {
    return files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
  }, [])

  const revokeAll = useCallback((urls: string[]) => {
    urls.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  const handleSelectMany = useCallback((files: File[]) => {
    setItems((prev) => {
      revokeAll(prev.map((p) => p.previewUrl))
      return toItems(files)
    })
    setEstimatedTotalSize(null)
  }, [revokeAll, toItems])

  // Backward compatibility: if DropZone calls onSelect (single file), treat as replace-all with one.
  const handleSelect = useCallback((f: File) => {
    handleSelectMany([f])
  }, [handleSelectMany])

  useEffect(() => () => {
    revokeAll(previewRef.current)
  }, [revokeAll])

  // 滑动质量时防抖计算并展示对应压缩大小
  useEffect(() => {
    if (items.length === 0) {
      setEstimatedTotalSize(null)
      return
    }
    const version = ++estimateVersionRef.current
    setEstimating(true)
    const t = setTimeout(async () => {
      try {
        let sum = 0
        for (const it of items) {
          const blob = await compressImage(it.file, quality)
          if (version !== estimateVersionRef.current) return
          sum += blob.size
        }
        if (version === estimateVersionRef.current) {
          setEstimatedTotalSize(sum)
        }
      } catch {
        if (version === estimateVersionRef.current) setEstimatedTotalSize(null)
      } finally {
        if (version === estimateVersionRef.current) setEstimating(false)
      }
    }, ESTIMATE_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [items, quality])

  const handleCompress = async () => {
    if (items.length === 0) return
    setCompressing({ running: true, done: 0, total: items.length })
    try {
      for (let i = 0; i < items.length; i++) {
        const { file } = items[i]
        const blob = await compressImage(file, quality)
        const name = file.name.replace(/\.[^.]+$/, '') + '-compressed.jpg'
        downloadBlob(blob, name)
        setCompressing((s) => ({ ...s, done: i + 1 }))
      }
    } finally {
      setCompressing((s) => ({ ...s, running: false }))
    }
  }

  const handleReplaceOne = useCallback((id: string, file: File) => {
    setItems((prev) => {
      const next = prev.map((it) => {
        if (it.id !== id) return it
        URL.revokeObjectURL(it.previewUrl)
        return { ...it, file, previewUrl: URL.createObjectURL(file) }
      })
      return next
    })
  }, [])

  const handleRemoveOne = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <DropZone
        title="Drag and drop your image here"
        subtitle={items.length ? `${items.length} image(s) selected — select again to replace` : `Support for JPEG, PNG and WebP files up to ${MAX_MB}MB`}
        accept={ACCEPT}
        maxSize={MAX_MB * 1024 * 1024}
        onSelect={handleSelect}
        onSelectMany={handleSelectMany}
        multiple
        previewUrl={previewUrl}
      />
      {total > 0 && (
        <div className="flex flex-col items-start pt-[20px] w-full">
          <div className="flex flex-col gap-5 w-full">
            <div className="w-full flex justify-center">
              <div className="max-w-[800px] w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {items.map((it) => (
                    <div key={it.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                      <div className="aspect-square w-full bg-muted-bg flex items-center justify-center p-2">
                        <img src={it.previewUrl} alt={it.file.name} className="max-w-full max-h-full w-auto h-auto object-contain" />
                      </div>
                      <div className="p-2 flex flex-col gap-2">
                        <div className="text-[12px] font-medium text-primary truncate" title={it.file.name}>{it.file.name}</div>
                        <div className="flex gap-2">
                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept={ACCEPT}
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleReplaceOne(it.id, f)
                                e.target.value = ''
                              }}
                            />
                            <span className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[12px] font-bold border border-border bg-white hover:bg-muted-bg text-primary">
                              Replace
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveOne(it.id)}
                            className="px-3 py-1.5 rounded-full text-[12px] font-bold border border-border bg-white hover:bg-muted-bg text-primary"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[14px] text-muted">
              <span>Original total: <strong className="text-primary font-semibold">{formatSize(originalTotalSize)}</strong></span>
              {(estimatedTotalSize !== null || estimating) && (
                <span>
                  {estimating ? (
                    'Calculating…'
                  ) : (
                    <>Compressed total: <strong className="text-primary font-semibold">{formatSize(estimatedTotalSize ?? 0)}</strong></>
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
                disabled={compressing.running}
                className="bg-primary px-8 py-2.5 rounded-full font-bold text-[14px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] disabled:opacity-60"
              >
                {compressing.running ? `Compressing… ${compressing.done}/${compressing.total}` : `Compress Now (${total})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

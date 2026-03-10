import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import DropZone from '../components/DropZone'

type Format = 'JPG' | 'PNG' | 'WebP' | 'AVIF'
const FORMATS: Format[] = ['JPG', 'PNG', 'WebP', 'AVIF']
type Item = { id: string; file: File; previewUrl: string }

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
  const [items, setItems] = useState<Item[]>([])
  const [format, setFormat] = useState<Format>('JPG')
  const [converting, setConverting] = useState<{ running: boolean; done: number; total: number }>({ running: false, done: 0, total: 0 })

  const previewRef = useRef<string[]>([])
  previewRef.current = items.map((i) => i.previewUrl)

  const previewUrl = items[0]?.previewUrl ?? null
  const total = items.length

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
  }, [revokeAll, toItems])

  // Backward compatibility: if DropZone calls onSelect (single file), treat as replace-all with one.
  const handleSelect = useCallback((f: File) => {
    handleSelectMany([f])
  }, [handleSelectMany])

  useEffect(() => () => {
    revokeAll(previewRef.current)
  }, [revokeAll])

  const outputExt = useMemo(() => (format === 'JPG' ? 'jpg' : format.toLowerCase()), [format])

  const handleConvert = async () => {
    if (items.length === 0) return
    setConverting({ running: true, done: 0, total: items.length })
    try {
      let avifWarned = false
      for (let i = 0; i < items.length; i++) {
        const { file } = items[i]
        try {
          const blob = await convertImage(file, format)
          const name = file.name.replace(/\.[^.]+$/, '') + '.' + outputExt
          downloadBlob(blob, name)
        } catch {
          if (format === 'AVIF' && !avifWarned) {
            avifWarned = true
            alert('AVIF may not be supported in this browser. Try WebP.')
          }
        } finally {
          setConverting((s) => ({ ...s, done: i + 1 }))
        }
      }
    } catch {
    } finally {
      setConverting((s) => ({ ...s, running: false }))
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
    <div className="flex flex-col items-center gap-[16px] w-full">
      <DropZone
        title="Drag and drop your image here"
        subtitle={items.length ? `${items.length} image(s) selected — select again to replace` : 'Support for JPEG, PNG and WebP files up to 20MB'}
        onSelect={handleSelect}
        onSelectMany={handleSelectMany}
        multiple
        previewUrl={previewUrl}
      />
      {total > 0 && (
        <div className="flex flex-col items-center gap-5 pt-[10px] w-full">
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
                            accept="image/jpeg,image/png,image/webp"
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
                disabled={converting.running}
                className="bg-primary px-8 py-2.5 rounded-full font-bold text-[14px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] disabled:opacity-60"
              >
                {converting.running ? `Converting… ${converting.done}/${converting.total}` : `Convert Now (${total})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

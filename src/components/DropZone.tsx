import { useCallback } from 'react'

const uploadIcon = (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" className="shrink-0">
    <path d="M42 27C42 33 38 43 24 43C10 43 6 33 6 27" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24.0078 5.10059V33.0001" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17L24 5L36 17" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

type DropZoneProps = {
  title: string
  subtitle: string
  accept?: string
  maxSize?: number
  onSelect: (file: File) => void
  onSelectMany?: (files: File[]) => void
  multiple?: boolean
  onDrop?: (file: File) => void
  disabled?: boolean
  /** When set, the card shows this image preview instead of the upload UI */
  previewUrl?: string | null
}

export default function DropZone({
  title,
  subtitle,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 20 * 1024 * 1024,
  onSelect,
  onSelectMany,
  multiple,
  onDrop,
  disabled,
  previewUrl,
}: DropZoneProps) {
  const acceptList = accept.split(',').map((t) => t.trim()).filter(Boolean)

  const isAccepted = useCallback((file: File) => {
    if (acceptList.length === 0) return true
    if (acceptList.includes(file.type)) return true
    // Fallback for patterns like image/*
    if (acceptList.some((t) => t.endsWith('/*') && file.type.startsWith(t.replace('/*', '/')))) return true
    return false
  }, [acceptList])

  const handleFiles = useCallback(
    (files: File[]) => {
      const ok = files.filter((f) => f.size <= maxSize && isAccepted(f))
      if (ok.length === 0) return

      if (multiple && onSelectMany) {
        onSelectMany(ok)
        return
      }

      const first = ok[0]
      onSelect(first)
      onDrop?.(first)
    },
    [isAccepted, maxSize, multiple, onDrop, onSelect, onSelectMany]
  )

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? [])
    if (list.length) handleFiles(list)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const list = Array.from(e.dataTransfer.files ?? [])
    if (list.length) handleFiles(list)
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const showPreview = Boolean(previewUrl)

  return (
    <div className="bg-white flex flex-col items-stretch p-[17px] rounded-[48px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-shadow duration-200 w-full h-[400px]">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="group min-h-0 flex-1 relative rounded-[32px] w-full flex flex-col items-center justify-center overflow-hidden"
      >
        {showPreview ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center min-w-0 min-h-0 pt-4 px-4 pb-20">
              <img
                src={previewUrl!}
                alt="Preview"
                className="max-w-full max-h-full w-auto h-auto object-contain object-center"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 min-h-[80px] flex items-center justify-center z-10">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept={accept}
                  multiple={multiple}
                  onChange={onFileChange}
                  className="sr-only"
                  disabled={disabled}
                />
                <span className="bg-white/90 hover:bg-white border border-border flex items-center justify-center px-4 py-1.5 rounded-full text-[12px] font-bold text-primary shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  Change File
                </span>
              </label>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center pb-6">
              <div className="bg-white border border-border flex items-center justify-center rounded-full size-16 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] mb-6 transition-[transform,box-shadow] duration-300 ease-out group-hover:scale-110 group-hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]">
                {uploadIcon}
              </div>
              <h3 className="font-semibold text-[20px] text-primary mb-2">{title}</h3>
              <p className="text-[14px] text-muted text-center max-w-[340px] mb-6">{subtitle}</p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={onFileChange}
                className="sr-only"
                disabled={disabled}
              />
              <span className="bg-primary flex items-center justify-center px-8 py-2.5 rounded-full text-[14px] font-bold text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] pointer-events-none">
                Select File
              </span>
            </label>
          </>
        )}
      </div>
    </div>
  )
}

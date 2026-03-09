import { useState, useRef, useEffect, useCallback } from 'react'
import lottie, { AnimationItem } from 'lottie-web'

function isLottieFile(f: File) {
  return (
    f.type === 'application/json' ||
    /\.(json|lottie)$/i.test(f.name)
  )
}

export default function LottiePreview() {
  const [file, setFile] = useState<File | null>(null)
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!containerRef.current || !animationData) return
    if (animRef.current) animRef.current.destroy()
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    })
    animRef.current = anim
    setIsPlaying(true)
    const updateProgress = () => {
      const { currentFrame, totalFrames } = anim
      if (!totalFrames) {
        setProgress(0)
        return
      }
      const pct = Math.min(100, Math.max(0, Math.round((currentFrame / totalFrames) * 100)))
      setProgress(pct)
    }
    const onLoopComplete = () => setProgress(0)
    anim.addEventListener('enterFrame', updateProgress)
    anim.addEventListener('loopComplete', onLoopComplete)
    updateProgress()
    return () => {
      anim.removeEventListener('enterFrame', updateProgress)
      anim.removeEventListener('loopComplete', onLoopComplete)
      anim.destroy()
      animRef.current = null
    }
  }, [animationData])

  const handleFile = useCallback((f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        setAnimationData(data)
      } catch {
        setAnimationData(null)
      }
    }
    reader.readAsText(f)
  }, [])

  const play = () => {
    animRef.current?.play()
    setIsPlaying(true)
  }
  const pause = () => {
    animRef.current?.pause()
    setIsPlaying(false)
  }
  const exportFile = () => {
    if (!file || !animationData) return
    const blob = new Blob([JSON.stringify(animationData)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = file.name
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const uploadIcon = (
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" className="shrink-0">
      <path d="M42 27C42 33 38 43 24 43C10 43 6 33 6 27" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24.0078 5.10059V33.0001" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17L24 5L36 17" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

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
    if (f && isLottieFile(f)) handleFile(f)
  }

  return (
    <div className="flex flex-col w-full">
      <div
        className={`group bg-white rounded-[48px] flex flex-1 flex-col items-center justify-center min-h-[400px] p-8 w-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-[box-shadow,colors] duration-200 ${
          !animationData && isDragging ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''
        }`}
        onDragOver={!animationData ? onDragOver : undefined}
        onDragLeave={!animationData ? onDragLeave : undefined}
        onDrop={!animationData ? onDrop : undefined}
      >
        {!animationData ? (
          <div className="max-w-[320px] flex flex-col gap-6 items-center">
            <div className="bg-white border border-border flex items-center justify-center rounded-full size-16 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-300 ease-out group-hover:scale-110 group-hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]">
              {uploadIcon}
            </div>
            <div className="flex flex-col gap-[7px] items-center">
              <h3 className="font-bold text-[20px] text-primary text-center">Lottie Previewer</h3>
              <p className="text-[14px] text-muted text-center leading-[22.75px]">
                Drop .json or .lottie files here to preview your<br />
                animation instantly.
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json,.lottie,application/json"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                  e.target.value = ''
                }}
              />
              <span className="bg-primary flex items-center justify-center px-8 py-2.5 rounded-full text-[14px] font-bold text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                Browse Files
              </span>
            </label>
          </div>
        ) : (
          <div ref={containerRef} className="w-full max-w-[400px] min-h-[200px]" />
        )}
      </div>
      {animationData && (
        <div className="pt-8 w-full flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[12px] text-muted tracking-[0.6px] uppercase">Playback Progress</span>
              <span className="font-bold text-[12px] text-primary">{progress}%</span>
            </div>
            <div className="bg-muted-bg h-[3px] rounded-full w-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex gap-2 items-center">
              <button type="button" onClick={isPlaying ? pause : play} className="size-[32px] rounded-2xl hover:bg-muted-bg flex items-center justify-center shrink-0" aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? (
                  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                    <path d="M16 12V36" stroke="#1b1b1b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M32 12V36" stroke="#1b1b1b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                    <path d="M15 24V11.8756L25.5 17.9378L36 24L25.5 30.0622L15 36.1244V24Z" fill="none" stroke="#1b1b1b" strokeWidth="4" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={exportFile}
              className="bg-primary flex gap-2 items-center justify-center px-8 py-2.5 rounded-full text-[14px] font-bold text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 0v7M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 9h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Export
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

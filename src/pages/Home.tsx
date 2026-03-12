import { useEffect, useRef, useState } from 'react'

const images = [
  new URL('../assets/card-1.png', import.meta.url).toString(),
  new URL('../assets/card-2.png', import.meta.url).toString(),
  new URL('../assets/card-3.png', import.meta.url).toString(),
  new URL('../assets/card-4.png', import.meta.url).toString(),
  new URL('../assets/card-5.png', import.meta.url).toString(),
]

const TOTAL = 11
const LOOP = 3
const VIRTUAL_TOTAL = TOTAL * LOOP
const MIDDLE_OFFSET = TOTAL

export default function Home() {
  const [virtualIndex, setVirtualIndex] = useState<number>(
    MIDDLE_OFFSET + Math.floor(TOTAL / 2),
  )
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const tracks = [
    '/audio/时空储蓄罐-Merry-2026.aac',
    '/audio/LAKEY-INSPIRED_DC-Prince.aac',
  ]

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const applyScrollTransforms = () => {
      const containerRect = el.getBoundingClientRect()
      const centerX = containerRect.left + containerRect.width / 2

      cardRefs.current.forEach((card) => {
        if (!card) return

        const rect = card.getBoundingClientRect()
        const cardCenter = rect.left + rect.width / 2
        const dx = cardCenter - centerX

        // 将距离映射到 [-1, 1]，越靠近中心变化越细腻
        const t = Math.max(-1, Math.min(1, dx / 320))
        const abs = Math.abs(t)

        const rotateY = t * -28
        const translateZ = -abs * 220
        const translateY = abs * 18
        const scale = 1 - abs * 0.22

        card.style.transform = `perspective(900px) translateZ(${translateZ}px) translateY(${translateY}px) rotateY(${rotateY}deg) scale(${scale})`
        card.style.transformStyle = 'preserve-3d'
      })
    }

    const schedule = () => {
      if (rafRef.current != null) return
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        applyScrollTransforms()
      })
    }

    const handle = () => {
      const containerRect = el.getBoundingClientRect()
      const centerX = containerRect.left + containerRect.width / 2

      let bestIndex = virtualIndex
      let bestDist = Number.POSITIVE_INFINITY

      cardRefs.current.forEach((card, i) => {
        if (!card) return
        const rect = card.getBoundingClientRect()
        const cardCenter = rect.left + rect.width / 2
        const dist = Math.abs(cardCenter - centerX)
        if (dist < bestDist) {
          bestDist = dist
          bestIndex = i
        }
      })

      setVirtualIndex((current) => (current !== bestIndex ? bestIndex : current))
      schedule()
    }

    handle()
    el.addEventListener('scroll', handle, { passive: true })
    window.addEventListener('resize', handle)
    return () => {
      el.removeEventListener('scroll', handle)
      window.removeEventListener('resize', handle)
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [virtualIndex])

  const scrollToIndex = (target: number, behavior: ScrollBehavior = 'smooth') => {
    const container = scrollRef.current
    const card = cardRefs.current[target]
    if (!container || !card) return
    const containerRect = container.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    const offset =
      cardRect.left -
      containerRect.left -
      (containerRect.width / 2 - cardRect.width / 2)
    container.scrollTo({
      left: container.scrollLeft + offset,
      behavior,
    })
  }

  useEffect(() => {
    // Initial centering on middle block
    scrollToIndex(virtualIndex, 'auto')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    // When we get too close to either edge of the virtual list,
    // jump by one "block" of TOTAL cards to keep the scroll in the middle.
    const threshold = Math.floor(TOTAL / 2)
    const totalVirtual = VIRTUAL_TOTAL

    let newIndex = virtualIndex
    if (virtualIndex <= threshold) {
      newIndex = virtualIndex + TOTAL
    } else if (virtualIndex >= totalVirtual - threshold - 1) {
      newIndex = virtualIndex - TOTAL
    }

    if (newIndex !== virtualIndex) {
      const currentCard = cardRefs.current[virtualIndex]
      const targetCard = cardRefs.current[newIndex]
      if (!currentCard || !targetCard) return

      const currentRect = currentCard.getBoundingClientRect()
      const targetRect = targetCard.getBoundingClientRect()
      const delta = targetRect.left - currentRect.left

      container.scrollLeft += delta
      setVirtualIndex(newIndex)
    }
  }, [virtualIndex])

  useEffect(() => {
    // 选中卡片 + 已开启且处于播放状态时自动播放
    if (!audioEnabled) {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
      }
      return
    }

    if (!isPlaying) {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
      }
      return
    }

    const audio = audioRef.current
    if (!audio) return

    const baseIndex = ((virtualIndex % TOTAL) + TOTAL) % TOTAL
    const src = tracks[baseIndex] ?? tracks[baseIndex % tracks.length]
    if (!src) return

    audio.loop = true
    if (audio.src !== new URL(src, window.location.href).toString()) {
      audio.src = src
    }

    void audio.play().catch(() => {
      // 忽略浏览器自动播放限制
    })
  }, [audioEnabled, virtualIndex])

  useEffect(() => {
    return () => {
      const audio = audioRef.current
      if (!audio) return
      audio.pause()
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const enableAudio = () => {
    setAudioEnabled(true)
  }

  const togglePlay = () => {
    setAudioEnabled(true)
    setIsPlaying((prev) => !prev)
  }

  const handlePrev = () => {
    enableAudio()
    setVirtualIndex((current) => {
      const next = current - 1
      scrollToIndex(next)
      return next
    })
  }

  const handleNext = () => {
    enableAudio()
    setVirtualIndex((current) => {
      const next = current + 1
      scrollToIndex(next)
      return next
    })
  }

  const cards = Array.from({ length: VIRTUAL_TOTAL }, (_, i) => ({
    id: i,
    src: images[i % images.length],
  }))

  return (
    <>
      <div
        ref={scrollRef}
        onPointerDown={enableAudio}
        className="absolute inset-x-0 top-[180px] overflow-x-auto no-scrollbar pt-[50px]"
      >
        <div className="w-[2640px] mx-auto flex items-center gap-[60px] py-[20px] h-[312px]">
          {cards.map((c, i) => {
            const isActive = i === virtualIndex
            const breathe = isPlaying && !isActive
            return (
              <div
                key={c.id}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                className={[
                  // transform 由 scroll rAF 实时驱动，避免滞后手势；这里只保留其他属性的过渡
                  'relative shrink-0 overflow-hidden transition-[width,height,opacity,border-radius] duration-300 ease-out will-change-transform',
                  breathe ? 'card-breathe-opacity' : '',
                  isActive
                    ? 'w-[240px] h-[312px] rounded-[24px] opacity-100'
                    : 'w-[180px] h-[234px] rounded-[20px] opacity-50',
                ].join(' ')}
              >
                <img
                  alt=""
                  src={c.src}
                  className={[
                    'absolute inset-0 w-full h-full object-cover pointer-events-none',
                    isActive ? 'rounded-[28px]' : 'rounded-[22px]',
                  ].join(' ')}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute bottom-[96px] left-1/2 -translate-x-1/2">
        <div className="relative w-[148px] h-[148px] rounded-full bg-[#111827] flex items-center justify-center">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="relative z-10 w-[44px] h-[44px] rounded-full flex items-center justify-center bg-[#1f2937] text-[#e5e7eb] hover:bg-black/80 transition-colors shadow-lg"
          >
            <span className="text-[20px] leading-none select-none">
              {isPlaying ? '⏸' : '▶'}
            </span>
          </button>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[82px] h-[82px] rounded-full border border-[#111827] bg-[#25272c]" />
          </div>

          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous card"
            className="absolute left-[22px] top-1/2 -translate-y-1/2 w-[32px] h-[32px] rounded-full flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
          >
            <span className="text-[18px] leading-none select-none">⏴</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next card"
            className="absolute right-[22px] top-1/2 -translate-y-1/2 w-[32px] h-[32px] rounded-full flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
          >
            <span className="text-[18px] leading-none select-none">⏵</span>
          </button>
        </div>
      </div>

      <div className="hidden">
        <audio ref={audioRef} preload="auto" />
      </div>
    </>
  )
}


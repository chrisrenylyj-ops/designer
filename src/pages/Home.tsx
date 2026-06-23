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
  const [activeGlow, setActiveGlow] = useState({ x: 50, y: 50 })
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const floatRafRef = useRef<number | null>(null)

  const tracks = [
    '/audio/时空储蓄罐-Merry-2026.aac',
    '/audio/LAKEY-INSPIRED_DC-Prince.aac',
    '/audio/Elyonbeats - Summer Train.m4a',
    '/audio/frank Sativa - dancing in the rain.m4a',
    '/audio/Dim Gray - Bucky Pizzarelli-Serenade in blue（Whispering remix）（小滔 remix）.mp3',
    '/audio/92914 - Miss The Time.m4a',
    "/audio/DANIEL - and Forevermore.m4a",
    '/audio/FunkyMo - 门.m4a',
    '/audio/JVKE,Annika Wells - her (feat. Annika Wells).m4a',
    "/audio/Saint Harison - why didn't you call.m4a",
    '/audio/Various Artists - 卡农（木吉他独奏版）.m4a',
  ]

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const applyScrollTransforms = () => {
      const containerRect = el.getBoundingClientRect()
      const centerX = containerRect.left + containerRect.width / 2

      cardRefs.current.forEach((card, index) => {
        if (!card) return

        const rect = card.getBoundingClientRect()
        const cardCenter = rect.left + rect.width / 2
        const dx = cardCenter - centerX

        // 将距离映射到 [-1, 1]，越靠近中心变化越细腻
        const t = Math.max(-1, Math.min(1, dx / 320))
        const abs = Math.abs(t)

        let rotateY = t * -28
        let translateZ = -abs * 220
        let translateY = abs * 18
        let scale = 1 - abs * 0.22

        // 未选中卡片：加强 3D 透视感，显得更远更有角度
        if (index !== virtualIndex) {
          rotateY *= 1.25
          translateZ *= 1.3
          translateY *= 1.15
          scale = 1 - abs * 0.28
        }

        const baseTransform = `perspective(900px) translateZ(${translateZ}px) translateY(${translateY}px) rotateY(${rotateY}deg) scale(${scale})`

        // 记录基础 transform，供鼠标悬停时叠加 3D 漂浮效果
        const dataset = card.dataset as any
        dataset.baseTransform = baseTransform
        const hoverTransform = dataset.hoverTransform ?? ''

        card.style.transform = `${baseTransform}${hoverTransform}`
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

  // hover 交互已移除；播放时的 3D 漂浮由下方 effect 负责叠加/清理

  useEffect(() => {
    // 选中卡片 + 已开启且处于播放状态时自动播放
    const audio = audioRef.current
    if (!audio) return

    if (!audioEnabled || !isPlaying) {
      audio.pause()
      return
    }

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
  }, [audioEnabled, isPlaying, virtualIndex])

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

  const normalizedIndex = ((virtualIndex % TOTAL) + TOTAL) % TOTAL

  const accentGradients = [
    'radial-gradient(ellipse 65% 45% at 16% 18%, rgba(96, 165, 250, 0.45), transparent 60%)',
    'radial-gradient(ellipse 65% 45% at 82% 22%, rgba(74, 222, 128, 0.4), transparent 60%)',
    'radial-gradient(ellipse 65% 45% at 18% 80%, rgba(244, 114, 182, 0.42), transparent 60%)',
    'radial-gradient(ellipse 70% 50% at 84% 72%, rgba(249, 168, 212, 0.45), transparent 60%)',
    'radial-gradient(ellipse 70% 52% at 50% 16%, rgba(251, 191, 36, 0.4), transparent 60%)',
  ]

  const accentGradient = accentGradients[normalizedIndex % accentGradients.length]
 
  useEffect(() => {
    // 播放音乐时，给当前选中卡片叠加自动循环的 3D 漂浮动效（不需要鼠标 hover）
    if (!isPlaying) {
      if (floatRafRef.current != null) {
        window.cancelAnimationFrame(floatRafRef.current)
        floatRafRef.current = null
      }
      const card = cardRefs.current[virtualIndex]
      if (card) {
        const dataset = card.dataset as any
        dataset.hoverTransform = ''
        const baseTransform = dataset.baseTransform ?? ''
        card.style.transform = baseTransform
      }
      return
    }

    const start = performance.now()
    const tick = (now: number) => {
      const card = cardRefs.current[virtualIndex]
      if (card) {
        const t = (now - start) / 1000
        const tiltX = Math.sin(t * 1.2) * 4
        const tiltY = Math.cos(t * 1.1) * 5
        // 不再改变 Z 轴距离，避免看起来有放大缩小
        const hoverTransform = ` rotateX(${tiltX}deg) rotateY(${tiltY}deg)`

        const dataset = card.dataset as any
        dataset.hoverTransform = hoverTransform
        const baseTransform = dataset.baseTransform ?? ''
        card.style.transform = `${baseTransform}${hoverTransform}`
      }

      floatRafRef.current = window.requestAnimationFrame(tick)
    }

    floatRafRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (floatRafRef.current != null) {
        window.cancelAnimationFrame(floatRafRef.current)
        floatRafRef.current = null
      }
      const card = cardRefs.current[virtualIndex]
      if (card) {
        const dataset = card.dataset as any
        dataset.hoverTransform = ''
        const baseTransform = dataset.baseTransform ?? ''
        card.style.transform = baseTransform
      }
    }
  }, [isPlaying, virtualIndex])

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700"
        style={{
          backgroundImage: accentGradient,
          mixBlendMode: 'soft-light',
        }}
      />
      <div
        ref={scrollRef}
        onPointerDown={enableAudio}
        className="absolute inset-x-0 top-[160px] overflow-x-auto overflow-y-visible no-scrollbar pt-[50px] z-10"
      >
        <div className="w-[2640px] mx-auto flex items-center gap-[60px] py-[20px] h-[352px]">
          {cards.map((c, i) => {
            const isActive = i === virtualIndex
            const breathe = isPlaying && !isActive
            return (
              <div
                key={c.id}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                onPointerMove={
                  isActive
                    ? (e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActiveGlow({
                          x: ((e.clientX - rect.left) / rect.width) * 100,
                          y: ((e.clientY - rect.top) / rect.height) * 100,
                        })
                      }
                    : undefined
                }
                onPointerLeave={isActive ? () => setActiveGlow({ x: 50, y: 50 }) : undefined}
                className={[
                  // transform 由 scroll rAF 实时驱动，避免滞后手势；这里只保留其他属性的过渡
                  'relative shrink-0 overflow-hidden transition-[width,height,opacity,border-radius] duration-300 ease-out will-change-transform',
                  breathe ? 'card-breathe-opacity' : '',
                  isActive
                    ? 'w-[240px] h-[312px] rounded-[24px] opacity-100'
                    : 'w-[180px] h-[234px] rounded-[20px] opacity-50',
                ].join(' ')}
              >
                {isActive && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[28px] z-10 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle 180px at ${activeGlow.x}% ${activeGlow.y}%, rgba(255,255,255,0.18), transparent 70%)`,
                      mixBlendMode: 'screen',
                    }}
                  />
                )}
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

      <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 z-20">
        <div className="relative w-[148px] h-[148px] rounded-full bg-[#111827] flex items-center justify-center">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="relative z-10 w-[44px] h-[44px] rounded-full flex items-center justify-center bg-transparent text-[#e5e7eb]"
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
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[32px] h-[32px] rounded-full flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
          >
            <img
              src={`${import.meta.env.BASE_URL}Vector.svg`}
              alt=""
              className="w-[16px] h-[16px]"
            />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next card"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[32px] h-[32px] rounded-full flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
          >
            <img
              src={`${import.meta.env.BASE_URL}Vector-1.svg`}
              alt=""
              className="w-[16px] h-[16px]"
            />
          </button>
        </div>
      </div>

      <div className="hidden">
        <audio ref={audioRef} preload="auto" />
      </div>
    </>
  )
}


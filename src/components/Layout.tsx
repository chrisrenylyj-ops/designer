import { useRef, useLayoutEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'Compress' },
  { path: '/convert', label: 'Convert' },
  { path: '/360', label: '360°' },
  { path: '/lottie', label: 'Lottie' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])
  const [pill, setPill] = useState({ left: 0, width: 0 })

  const activeIndex = tabs.findIndex(
    (t) => t.path === location.pathname || (t.path === '/' && location.pathname === '/')
  )

  const pageBgClass =
    location.pathname === '/' ? 'bg-page-compress' :
    location.pathname === '/convert' ? 'bg-page-convert' :
    location.pathname === '/360' ? 'bg-page-360' :
    location.pathname === '/lottie' ? 'bg-page-lottie' :
    'bg-body'

  useLayoutEffect(() => {
    if (activeIndex < 0 || !navRef.current) return
    const el = tabRefs.current[activeIndex]
    if (!el) return
    const navRect = navRef.current.getBoundingClientRect()
    const tabRect = el.getBoundingClientRect()
    setPill({
      left: tabRect.left - navRect.left,
      width: tabRect.width,
    })
  }, [activeIndex, location.pathname])

  return (
    <div className={`min-h-screen flex flex-col items-center relative ${pageBgClass}`}>
      <div className="flex flex-col items-start w-full max-w-[1200px] px-6 flex-1">
        <header className="flex items-center justify-between py-6 w-full px-[176px]">
          <Link to="/" className="flex items-center shrink-0" aria-label="Home">
          <img src={\{import.meta.env.BASE_URL}logo.svg\`}` （即整句是：`<img src={\`{import.meta.env.BASE_URL}logo.svg`} alt="" className="h-9 w-8 block" width={32} height={36} />`）
          </Link>
          <nav
            ref={navRef}
            className="relative bg-white flex items-center p-[7px] rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
          >
            {activeIndex >= 0 && (
              <div
                className="absolute top-[7px] bottom-[7px] bg-primary rounded-full transition-[left,width] duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ left: pill.left, width: pill.width }}
                aria-hidden
              />
            )}
            {tabs.map((tab, i) => (
              <div
                key={tab.path}
                ref={(el) => { tabRefs.current[i] = el }}
                className="relative z-10"
              >
                <NavLink
                  to={tab.path}
                  end={tab.path === '/'}
                  className={({ isActive }) =>
                    `flex flex-col h-full items-center justify-center px-6 py-2 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors ${
                      isActive ? 'text-white' : 'text-muted hover:text-primary'
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              </div>
            ))}
          </nav>
        </header>
        <main className="flex flex-col items-start justify-center px-[176px] w-full flex-1 pb-[180px]">
          <div className="flex flex-col items-center justify-center max-w-[800px] w-full">
            {children}
          </div>
        </main>
      </div>
      <footer className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[14px] font-medium text-primary whitespace-nowrap">
        Good Design.
      </footer>
    </div>
  )
}

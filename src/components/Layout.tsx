import { Link, NavLink, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/compress', label: 'Compress' },
  { path: '/convert', label: 'Convert' },
  { path: '/360', label: '360°' },
  { path: '/lottie', label: 'Lottie' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const activeIndex = tabs.findIndex((t) => t.path === location.pathname)

  const pageBgClass =
    location.pathname === '/' ? 'bg-page-home' :
    location.pathname === '/compress' ? 'bg-page-compress' :
    location.pathname === '/convert' ? 'bg-page-convert' :
    location.pathname === '/360' ? 'bg-page-360' :
    location.pathname === '/lottie' ? 'bg-page-lottie' :
    'bg-body'

  return (
    <div className={`min-h-screen flex flex-col items-center relative ${pageBgClass}`}>
      <div className="flex flex-col items-center w-full max-w-[1200px] px-6 flex-1">
        <header className="flex items-center justify-center py-[24px] w-full">
          <div className="flex items-center justify-between w-[800px]">
            <Link to="/" className="flex items-center shrink-0" aria-label="Home">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-9 w-8 block" width={32} height={36} />
            </Link>
            <nav className="bg-white border border-border flex items-center h-[50px] p-[7px] rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.path === '/'}
                  className={({ isActive }) =>
                    [
                      'flex flex-col h-full items-center justify-center px-6 py-2 rounded-full text-[14px] font-medium whitespace-nowrap',
                      isActive ? 'text-primary' : 'text-muted',
                    ].join(' ')
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        {location.pathname === '/'
          ? (
            children
          ) : (
            <main className="flex flex-col items-start justify-center w-full flex-1 pb-[180px] px-[176px]">
              <div className="flex flex-col items-center justify-center w-full max-w-[800px]">
                {children}
              </div>
            </main>
          )}
      </div>
      <footer className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[14px] font-medium text-primary whitespace-nowrap">
        Good Design.
      </footer>
    </div>
  )
}

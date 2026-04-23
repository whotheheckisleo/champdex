import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const dexMenuItems = [
  { to: '/dex', label: 'Pokemon' },
  { to: '/dex/abilities', label: 'Abilities' },
  { to: '/dex/moves', label: 'Moves' },
  { to: '/dex/items', label: 'Items' },
]

const navItems = [
  { to: '/team-planner', label: 'Team Planner' },
  { to: '/about', label: 'About' },
]

export function AppShell() {
  const location = useLocation()
  const isDexRoute = location.pathname === '/dex' || location.pathname.startsWith('/dex/')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dexDropdownOpen, setDexDropdownOpen] = useState(false)
  const [menuPathname, setMenuPathname] = useState(location.pathname)
  const dexDropdownRef = useRef<HTMLLIElement>(null)

  // Menus are considered closed whenever the pathname changes
  const isMobileMenuOpen = mobileMenuOpen && menuPathname === location.pathname
  const isDexDropdownOpen = dexDropdownOpen && menuPathname === location.pathname

  function handleOpenMobileMenu() {
    setMenuPathname(location.pathname)
    setMobileMenuOpen(true)
  }

  function handleOpenDexDropdown() {
    setMenuPathname(location.pathname)
    setDexDropdownOpen(true)
  }

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    if (!isDexDropdownOpen) return
    function handlePointerDown(e: PointerEvent) {
      if (dexDropdownRef.current && !dexDropdownRef.current.contains(e.target as Node)) {
        setDexDropdownOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isDexDropdownOpen])

  return (
    <div className="min-h-screen text-stone-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink
            className="brand-logo text-sm leading-none text-white transition hover:text-amber-400 sm:text-base"
            to="/"
          >
            ChampDex
          </NavLink>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden sm:block">
            <ul className="flex items-center gap-8 text-sm font-semibold text-slate-300">
              <li className="group relative shrink-0" ref={dexDropdownRef}>
                <div className="flex items-center gap-1.5">
                  <NavLink
                    className={() =>
                      [
                        'border-b border-transparent py-1 transition',
                        isDexRoute ? 'border-amber-400 text-white' : 'hover:text-white',
                      ].join(' ')
                    }
                    to="/dex"
                  >
                    Dex
                  </NavLink>
                  <button
                    aria-expanded={isDexDropdownOpen}
                    aria-haspopup="true"
                    aria-label="Toggle Dex menu"
                    className={[
                      'flex items-center text-[10px] transition',
                      isDexRoute || isDexDropdownOpen
                        ? 'text-amber-400'
                        : 'text-slate-400 group-hover:text-amber-400 hover:text-white',
                    ].join(' ')}
                    onClick={() => (isDexDropdownOpen ? setDexDropdownOpen(false) : handleOpenDexDropdown())}
                    type="button"
                  >
                    ▾
                  </button>
                </div>

                <div
                  className={[
                    'absolute left-1/2 top-full z-20 min-w-44 -translate-x-1/2 pt-2 transition duration-150',
                    isDexDropdownOpen
                      ? 'pointer-events-auto visible opacity-100'
                      : 'pointer-events-none invisible opacity-0 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100',
                  ].join(' ')}
                >
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-xl shadow-black/50">
                    <ul className="space-y-0.5" role="menu">
                      {dexMenuItems.map((item) => (
                        <li key={item.to} role="none">
                          <Link
                            className="block rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                            role="menuitem"
                            to={item.to}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>

              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      [
                        'border-b border-transparent py-1 transition',
                        isActive ? 'border-amber-400 text-white' : 'hover:text-white',
                      ].join(' ')
                    }
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile hamburger */}
          <button
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-700 sm:hidden"
            onClick={() => (isMobileMenuOpen ? setMobileMenuOpen(false) : handleOpenMobileMenu())}
            type="button"
          >
            <span
              className={[
                'block h-0.5 w-5 bg-slate-300 transition-all duration-200',
                isMobileMenuOpen ? 'translate-y-1.75 rotate-45' : '',
              ].join(' ')}
            />
            <span
              className={[
                'block h-0.5 w-5 bg-slate-300 transition-all duration-200',
                isMobileMenuOpen ? 'opacity-0' : '',
              ].join(' ')}
            />
            <span
              className={[
                'block h-0.5 w-5 bg-slate-300 transition-all duration-200',
                isMobileMenuOpen ? '-translate-y-1.75 -rotate-45' : '',
              ].join(' ')}
            />
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/10 sm:hidden" id="mobile-menu">
            <nav aria-label="Mobile navigation">
              <ul className="px-4 py-3 text-sm font-semibold">
                <li>
                  <p className="pb-1.5 pt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Dex
                  </p>
                  <ul className="mb-3 space-y-0.5">
                    {dexMenuItems.map((item) => (
                      <li key={item.to}>
                        <Link
                          className="block rounded-lg px-3 py-2.5 text-slate-300 transition hover:bg-white/5 hover:text-white"
                          to={item.to}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="border-t border-white/10 pt-2">
                  <ul className="space-y-0.5">
                    {navItems.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          className={({ isActive }) =>
                            [
                              'block rounded-lg px-3 py-2.5 transition',
                              isActive
                                ? 'text-amber-400'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white',
                            ].join(' ')
                          }
                          to={item.to}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}
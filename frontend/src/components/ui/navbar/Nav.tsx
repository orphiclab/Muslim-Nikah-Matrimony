'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Decode JWT payload and check if token is still valid (not expired)
function isTokenValid(token: string): boolean {
  try {
    // JWT uses base64url — must convert -→+ and _→/ before atob()
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64))
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

const Nav = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)
  const [mounted, setMounted] = useState(false)   // prevents SSR hydration flash

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About us', href: '/about' },
    { name: 'Packages', href: '/packages' },
    { name: 'Profiles', href: '/profiles' },
    { name: 'Contact us', href: '/contact' },
  ]

  // Read auth from localStorage — validates token expiry each time
  useEffect(() => {
    const sync = () => {
      const token = localStorage.getItem('mn_token')
      const stored = localStorage.getItem('mn_user')

      if (token && stored && isTokenValid(token)) {
        // Token is present and not expired — show logged-in state
        setUser(JSON.parse(stored))
      } else {
        // Token missing, expired, or malformed — clear stale session
        if (token || stored) {
          localStorage.removeItem('mn_token')
          localStorage.removeItem('mn_user')
        }
        setUser(null)
      }
      setMounted(true)   // mark hydration complete after first sync
    }
    sync()                                                     // run on mount / pathname change
    window.addEventListener('mn_auth_change', sync)           // fired by dashboard/nav logout
    window.addEventListener('storage', sync)                  // fired by other tabs
    return () => {
      window.removeEventListener('mn_auth_change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [pathname])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Hide the global nav on dashboard / admin — they have their own sidebar layout
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  if (isDashboard) return null

  const logout = () => {
    localStorage.removeItem('mn_token')
    localStorage.removeItem('mn_user')
    setUser(null)
    window.dispatchEvent(new Event('mn_auth_change'))
    router.push('/')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const linkBase = 'font-poppins font-normal text-[18px] transition-colors duration-200'
  const linkInactive = 'text-white hover:text-[#DB9D30]'
  const linkActiveDesktop = 'text-[#DB9D30] hover:text-[#DB9D30]/80'
  const linkActiveMobile = 'text-[#DB9D30] hover:text-[#DB9D30]/80'

  return (
    <div className="fixed top-3 sm:top-5 left-0 right-0 z-[500] isolate flex touch-manipulation justify-center">
      <div className=" container mx-auto containerpadding flex flex-col gap-2">
        <nav className=" backdrop-blur-md bg-[#4B7F73]/50 border border-white/15 rounded-full shadow-2xl shadow-black/30">
          <div className=" px-4 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center shrink-0" aria-label="Muslim Nikah home">
                <Image
                  src="/images/muslimLogo1.png"
                  alt="Muslim Nikah"
                  width={200}
                  height={48}
                  className="h-8 w-auto sm:h-9 lg:h-10 object-contain object-left"
                  priority
                />
              </Link>

              <div className="hidden xl:flex min-w-0 flex-1 items-center justify-center gap-3 xl:gap-5 2xl:gap-8">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${linkBase} whitespace-nowrap text-[15px] xl:text-[16px] 2xl:text-[18px] ${active ? linkActiveDesktop : linkInactive}`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>

              {/* Auth buttons — desktop: hidden until client hydration to avoid flash */}
              <div className="hidden xl:flex shrink-0 items-center justify-end space-x-3">
                {mounted && (user ? (
                  <>
                    <Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard/parent'}>
                      <button type="button"
                        className="text-white font-poppins font-medium px-4 py-1.5 transition-colors duration-200 hover:text-[#DB9D30]"
                        style={{ fontSize: '16px' }}>
                        My Dashboard
                      </button>
                    </Link>
                    <button type="button" onClick={logout}
                      className="bg-white text-[#010806] font-poppins font-medium px-6 py-1.5 rounded-full hover:bg-white/90 transition-colors duration-200"
                      style={{ fontSize: '16px' }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <button type="button"
                        className="text-white font-poppins font-medium px-4 py-1.5 transition-colors duration-200 hover:text-[#DB9D30]"
                        style={{ fontSize: '18px' }}>
                        Login
                      </button>
                    </Link>
                    <Link href="/register">
                      <button type="button"
                        className="bg-white text-[#010806] font-poppins font-medium px-6 py-1.5 rounded-full hover:bg-white/90 transition-colors duration-200"
                        style={{ fontSize: '18px' }}>
                        Register
                      </button>
                    </Link>
                  </>
                ))}
              </div>

              {/* Hamburger — hidden from xl up (desktop); wrapper avoids display conflicts with inline-flex */}
              <div className="shrink-0 xl:hidden">
                <button type="button"
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full p-2 text-white [-webkit-tap-highlight-color:transparent] touch-manipulation hover:bg-white/10 active:bg-white/20 transition-colors"
                  aria-expanded={menuOpen} aria-controls="mobile-nav"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  onClick={() => setMenuOpen((open) => !open)}>
                  <span className="sr-only">Menu</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    {menuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {menuOpen && (
          <div id="mobile-nav"
            className="xl:hidden touch-manipulation rounded-2xl border border-white/15 bg-[#2d5c4f]/95 backdrop-blur-md shadow-2xl shadow-black/30 overflow-hidden">
            <ul className="flex flex-col">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.name} className="border-b border-white/10 last:border-0">
                    <Link href={item.href}
                      className={`flex items-center w-full px-5 py-3.5 ${linkBase} ${active ? linkActiveMobile : linkInactive}`}
                      style={{ fontSize: '16px' }}>
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-col gap-2 px-4 py-4 border-t border-white/15 bg-white/5">
              {mounted && (user ? (
                <>
                  <Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard/parent'}
                    className="flex items-center justify-center w-full rounded-xl px-4 py-3 text-white font-poppins font-medium text-[15px] border border-white/20 hover:bg-white/10 transition-colors">
                    My Dashboard
                  </Link>
                  <button type="button" onClick={logout}
                    className="flex items-center justify-center w-full bg-white text-[#1B6B4A] font-poppins font-semibold text-[15px] px-4 py-3 rounded-xl hover:bg-white/90 transition-colors">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login"
                    className="flex items-center justify-center w-full rounded-xl px-4 py-3 text-white font-poppins font-medium text-[15px] border border-white/20 hover:bg-white/10 transition-colors">
                    Login
                  </Link>
                  <Link href="/register"
                    className="flex items-center justify-center w-full bg-white text-[#1B6B4A] font-poppins font-semibold text-[15px] px-4 py-3 rounded-xl hover:bg-white/90 transition-colors">
                    Register
                  </Link>
                </>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Nav

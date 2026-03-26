'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const Nav = () => {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About us', href: '/about' },
    { name: 'Packages', href: '/packages' },
    { name: 'Profiles', href: '/profiles' },
    { name: 'Contact us', href: '/contact' },
  ]

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const linkBase =
    'font-poppins font-normal text-[18px] transition-colors duration-200'
  const linkInactive = 'text-white hover:text-[#DB9D30]'
  const linkActiveDesktop =
    'text-[#DB9D30]  hover:text-[#DB9D30]/80'
  const linkActiveMobile =
     'text-[#DB9D30]  hover:text-[#DB9D30]/80'

  return (
    <div className="fixed top-5 left-0 right-0 z-500 isolate flex touch-manipulation justify-center containerpadding container mx-auto">
      <div className="w-full flex flex-col gap-2">
        <nav className="w-full backdrop-blur-md bg-[#4B7F73]/50 border border-white/15 rounded-full shadow-2xl shadow-black/30">
          <div className="px-4 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center shrink-0">
                <span className="text-white font-poppins text-[18px] sm:text-[20px] font-medium uppercase">
                  Muslim Nikah
                </span>
              </Link>

              <div className="hidden md:flex flex-1 items-center justify-center gap-2 md:gap-4 lg:gap-8">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${linkBase} ${
                        active ? linkActiveDesktop : linkInactive
                      }`}
                      style={{ fontSize: '18px' }}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>

              <div className="hidden md:flex items-center justify-end space-x-3 shrink-0">
                <Link href="/login">
                  <button
                    type="button"
                    className="text-white font-poppins font-medium px-4 py-1.5 transition-colors duration-200 hover:text-[#DB9D30]"
                    style={{ fontSize: '18px' }}
                  >
                    Login
                  </button>
                </Link>
                <Link href="/register">
                  <button
                    type="button"
                    className="bg-white text-[#010806] font-poppins font-medium px-6 py-1.5 rounded-full hover:bg-white/90 transition-colors duration-200"
                    style={{ fontSize: '18px' }}
                  >
                    Register
                  </button>
                </Link>
              </div>

              <button
                type="button"
                className="md:hidden inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-2 text-white [-webkit-tap-highlight-color:transparent] touch-manipulation hover:bg-white/10 transition-colors"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="sr-only">Menu</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  {menuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {menuOpen ? (
          <div
            id="mobile-nav"
            className="md:hidden touch-manipulation rounded-2xl border border-white/15 bg-[#4B7F73]/90 backdrop-blur-md shadow-xl shadow-black/20 px-4 py-4"
          >
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`block w-full text-left px-3 py-2.5 ${linkBase} ${
                        active ? linkActiveMobile : linkInactive
                      }`}
                      style={{ fontSize: '18px' }}
                    >
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 flex flex-col gap-2 border-t border-white/15 pt-4">
              <Link
                href="/login"
                className={`block text-center rounded-xl px-3 py-2.5 ${linkBase} ${linkInactive}`}
                style={{ fontSize: '18px' }}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block w-full text-center bg-white text-[#010806] font-poppins font-medium px-6 py-2.5 rounded-full hover:bg-white/90 transition-colors duration-200"
                style={{ fontSize: '18px' }}
              >
                Register
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Nav

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => setServicesOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const toggleMenu = () => setMenuOpen((v) => !v)

  const hamburgerStyle = (i: number) => {
    if (!menuOpen) return {}
    if (i === 0) return { transform: 'rotate(45deg) translate(5px, 5px)' }
    if (i === 1) return { opacity: 0 }
    return { transform: 'rotate(-45deg) translate(5px, -5px)' }
  }

  return (
    <>
      <nav
        id="navbar"
        style={{ background: scrolled ? 'rgba(255,255,255,0.99)' : 'rgba(255,255,255,0.97)' }}
      >
        <div className="container">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">
              <Image src="/logo.png" alt="Edge8" width={120} height={36} style={{ width: 'auto', height: '36px' }} priority />
            </Link>

            <ul className="nav-links">
              <li
                className={servicesOpen ? 'open' : ''}
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
              >
                <button
                  className="has-dropdown"
                  aria-haspopup="true"
                  onClick={(e) => {
                    e.stopPropagation()
                    setServicesOpen((v) => !v)
                  }}
                >
                  Services <span className="dropdown-icon">▾</span>
                </button>
                <div className="dropdown">
                  <Link href="/your-first-ai-hire">Your First AI Hire</Link>
                  <Link href="/ai-capabilities-audit">AI Capabilities Audit</Link>
                  <Link href="/caio-leadership">CAIO Leadership</Link>
                  <Link href="/global-staffing">Global Staffing</Link>
                  <Link href="/training-and-certification">Training &amp; Certification</Link>
                </div>
              </li>

              <li><Link href="/ai-programs">AI Programs</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/about">About</Link></li>
            </ul>

            <Link href="/contact" className="btn btn-primary nav-cta">
              Book a Conversation
            </Link>

            <button
              className="nav-hamburger"
              id="hamburger"
              aria-label="Menu"
              onClick={toggleMenu}
            >
              <span style={hamburgerStyle(0)} />
              <span style={hamburgerStyle(1)} />
              <span style={hamburgerStyle(2)} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} id="mobileMenu">
        <MobileAccordion label="Services" id="mobileServicesAccordion">
          <Link href="/your-first-ai-hire" onClick={() => setMenuOpen(false)}>Your First AI Hire</Link>
          <Link href="/ai-capabilities-audit" onClick={() => setMenuOpen(false)}>AI Capabilities Audit</Link>
          <Link href="/caio-leadership" onClick={() => setMenuOpen(false)}>CAIO Leadership</Link>
          <Link href="/global-staffing" onClick={() => setMenuOpen(false)}>Global Staffing</Link>
          <Link href="/training-and-certification" onClick={() => setMenuOpen(false)}>Training &amp; Certification</Link>
        </MobileAccordion>

        <Link href="/ai-programs" onClick={() => setMenuOpen(false)}>AI Programs</Link>
        <Link href="/blog" onClick={() => setMenuOpen(false)}>Blog</Link>
        <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
        <Link href="/contact" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
          Book a Conversation
        </Link>
      </div>
    </>
  )
}

function MobileAccordion({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`mobile-accordion${open ? ' open' : ''}`} id={id}>
      <button
        className="mobile-accordion-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {label} <span className="mobile-accordion-icon">▾</span>
      </button>
      <div className="mobile-accordion-panel">{children}</div>
    </div>
  )
}

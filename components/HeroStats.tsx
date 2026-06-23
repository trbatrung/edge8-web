'use client'

import { useState, useEffect, useRef } from 'react'

const STATS = [
  {
    target: 190,
    label: 'Workflows Automated',
    sub: 'with AI Agents running across our client base',
  },
  {
    target: 16,
    label: 'Leadership Teams',
    sub: 'certified to run AI on their own',
  },
  {
    target: 46,
    label: 'Applications Launched',
    sub: 'launched by 11 clients in the last 3 months',
  },
]

export default function HeroStats() {
  const [counts, setCounts] = useState([0, 0, 0])
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.4 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const targets = STATS.map(s => s.target)
    const duration = 1800
    const start = Date.now()
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setCounts(targets.map(v => Math.round(v * ease)))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible])

  return (
    <section className="hero-stats" aria-label="Edge8 program results to date" ref={ref}>
      <div className="container">
        <div className="hero-stats-grid">
          {STATS.map((stat, i) => (
            <div className="hero-stat reveal" key={stat.label}>
              <div className="hero-stat-number">{counts[i]}</div>
              <div className="hero-stat-label">{stat.label}</div>
              <div className="hero-stat-sub">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

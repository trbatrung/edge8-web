'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const testimonials = [
  { text: "I invited Dave to speak at the AI Summit in Sabah, and he was a natural on stage, bringing a fresh style the audience loved.", name: 'Dato George Lim', role: 'Founder & CEO, G&A GROUP & GA SPACE', avatar: '/services/images/services-ai-capabilities-audit-testimonials-Dato.jpg' },
  { text: "Dave was able to greatly expand our general knowledge of AI and demystify the challenges of implementation. I highly recommend Edge8.ai as a YPO resource.", name: 'John VanNewkirk', role: 'YPO Gold Seattle, Forum 6', avatar: '/homepage/images/home-page-testimonials-John.jpg' },
  { text: "He was extremely knowledgeable and engaging. Real-world experiences complemented our class discussions perfectly.", name: 'Dr. Brooks Holtom', role: 'Professor of Management, Georgetown', avatar: '/homepage/images/home-page-testimonials-Dr Holtom.jpg' },
  { text: "Love the new look and branding. The website looks so good. I'm deeply grateful.", name: 'Dao Nguyen', role: 'Founder, DN Legal', avatar: '/homepage/images/home-page-testimonials-Dao Nguyen.jpg' },
]

const T_COUNT_A = testimonials.length
const extTestimonialsA = [...testimonials, ...testimonials, ...testimonials]

export default function AiCapabilitiesAuditPage() {
  const [activeExtIdxA, setActiveExtIdxA] = useState(T_COUNT_A)
  const viewportRefA = useRef<HTMLDivElement>(null)
  const trackRefA = useRef<HTMLDivElement>(null)
  const snapTimerRefA = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSnappingRefA = useRef(false)
  const currentTestimonialA = ((activeExtIdxA - T_COUNT_A) % T_COUNT_A + T_COUNT_A) % T_COUNT_A

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const viewport = viewportRefA.current
    const track = trackRefA.current
    if (!viewport || !track) return
    const cards = track.querySelectorAll<HTMLElement>('.t-card-audit')
    if (cards.length === 0) return
    const updateActive = () => {
      if (isSnappingRefA.current) return
      const cx = viewport.scrollLeft + viewport.offsetWidth / 2
      let closest = 0, minDist = Infinity
      cards.forEach((card, i) => {
        const cardCx = card.offsetLeft + card.offsetWidth / 2
        const dist = Math.abs(cx - cardCx)
        if (dist < minDist) { minDist = dist; closest = i }
      })
      setActiveExtIdxA(closest)
      if (snapTimerRefA.current) clearTimeout(snapTimerRefA.current)
      const targetIdx = closest < T_COUNT_A ? closest + T_COUNT_A
        : closest >= T_COUNT_A * 2 ? closest - T_COUNT_A : -1
      if (targetIdx >= 0) {
        snapTimerRefA.current = setTimeout(() => {
          const pad = parseFloat(track.style.paddingLeft || '0')
          isSnappingRefA.current = true
          viewport.style.scrollSnapType = 'none'
          viewport.scrollLeft = cards[targetIdx].offsetLeft - pad
          setActiveExtIdxA(targetIdx)
          requestAnimationFrame(() => {
            viewport.style.scrollSnapType = ''
            requestAnimationFrame(() => { isSnappingRefA.current = false })
          })
        }, 50)
      }
    }
    viewport.addEventListener('scroll', updateActive, { passive: true })
    const setEdgePadding = () => {
      if (!cards[T_COUNT_A]) return
      const cardW = cards[T_COUNT_A].offsetWidth
      const vw = viewport.offsetWidth
      const pad = Math.max(0, (vw - cardW) / 2)
      track.style.paddingLeft = `${pad}px`
      track.style.paddingRight = `${pad}px`
      viewport.scrollLeft = cards[T_COUNT_A].offsetLeft - pad
    }
    setEdgePadding()
    return () => {
      viewport.removeEventListener('scroll', updateActive)
      if (snapTimerRefA.current) clearTimeout(snapTimerRefA.current)
    }
  }, [])

  const scrollToTestimonialA = useCallback((realIdx: number) => {
    const viewport = viewportRefA.current
    const track = trackRefA.current
    if (!viewport || !track) return
    const cards = track.querySelectorAll<HTMLElement>('.t-card-audit')
    const pad = parseFloat(track.style.paddingLeft || '0')
    const extIdx = T_COUNT_A + realIdx
    if (cards[extIdx]) {
      viewport.scrollTo({ left: cards[extIdx].offsetLeft - pad, behavior: 'smooth' })
    }
  }, [currentTestimonialA])

  return (
    <main>
      {/* HERO */}
      <section className="svc-hero">
        <div className="svc-hero-bg" />
        <div className="svc-hero-grid" />
        <div className="container">
          <div className="svc-hero-inner">
            <div className="svc-hero-text">
              <h1>Turn Your AI Experiments Into ROI-Driving Systems</h1>
              <p className="svc-hero-sub">Stop guessing about AI. Get a clear roadmap from experts who&apos;ve built real AI programs, not from consultants who only theorize about them.</p>
              <a href="/contact" className="btn btn-contact">Book a Free AI Audit →</a>
            </div>
            <div className="svc-hero-img">
              <Image src="/services/images/services-ai-capabilities-audit-hero.jpg" alt="AI Capabilities Audit" width={640} height={480} priority />
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="section">
        <div className="container">
          <div className="reveal">
            <span className="section-label">The Problem</span>
            <h2 className="section-title">95% of Companies See Zero ROI from AI</h2>
          </div>
          <div className="stat-pullquote reveal" style={{ marginTop: 48 }}>
            <div className="stat-num">95%</div>
            <p>of companies report ZERO return on investment despite massive AI investment. Source: MIT Sloan Research.</p>
          </div>
          <div className="problem-cards" style={{ marginTop: 48 }}>
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
              </div>
              <div className="problem-card-title">No Strategic Direction</div>
              <p className="problem-card-desc">AI tools are adopted ad hoc, with no alignment to business goals or measurable outcomes.</p>
            </div>
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              </div>
              <div className="problem-card-title">Data Problems Disguised as AI Problems</div>
              <p className="problem-card-desc">Companies invest in AI models but have data that&apos;s unstructured, incomplete, or siloed.</p>
            </div>
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className="problem-card-title">No Ownership</div>
              <p className="problem-card-desc">AI initiatives lack a dedicated leader, so experiments never scale into programs.</p>
            </div>
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div className="problem-card-title">Wrong Metrics</div>
              <p className="problem-card-desc">Teams measure AI by adoption, not by business impact, so they never know if it&apos;s working.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <div className="reveal">
            <span className="section-label">How It Works</span>
            <h2 className="section-title">Three Levels of AI Transformation</h2>
          </div>
          <div className="how-steps" style={{ marginTop: 48 }}>
            {[
              { num: '01', title: 'Discovery', desc: 'We audit your current AI usage, data infrastructure, team capabilities, and business processes to identify gaps and opportunities.' },
              { num: '02', title: 'Design', desc: 'We create a customized AI roadmap with prioritized initiatives, success metrics, and implementation timelines tailored to your business.' },
              { num: '03', title: 'Build & Deploy', desc: 'We implement your highest-ROI AI programs, train your team, and establish the processes to sustain and scale your results.' },
            ].map((step) => (
              <div key={step.num} className="how-step reveal">
                <div className="how-step-num">{step.num}</div>
                <div className="how-step-title">{step.title}</div>
                <p className="how-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section">
        <div className="container">
          <div className="reveal">
            <span className="section-label">Pricing</span>
            <h2 className="section-title">Choose Your Path to AI Excellence</h2>
          </div>
          <div className="pricing-grid" style={{ marginTop: 48 }}>
            <div className="pricing-card reveal">
              <div className="pricing-name">Foundation</div>
              <div className="pricing-price">$4,999</div>
              <div className="pricing-period">One-time investment</div>
              <div className="pricing-features">
                {['AI readiness assessment', 'Data audit & gap analysis', 'Top 3 AI opportunities identified', '90-day implementation roadmap', '2-hour strategy session'].map((f) => (
                  <div key={f} className="pricing-feature">{f}</div>
                ))}
              </div>
              <a href="https://ai-officer.typeform.com/letstalk" className="btn pricing-cta-ghost" target="_blank" rel="noopener noreferrer">Get Started →</a>
            </div>
            <div className="pricing-card featured reveal">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-name">Standard</div>
              <div className="pricing-price">$9,999</div>
              <div className="pricing-period">One-time investment</div>
              <div className="pricing-features">
                {['Everything in Foundation', 'Full team interviews', 'Process mapping & automation opportunities', 'Custom AI tools evaluation', 'Priority implementation support', '30-day follow-up session'].map((f) => (
                  <div key={f} className="pricing-feature">{f}</div>
                ))}
              </div>
              <a href="https://ai-officer.typeform.com/letstalk" className="btn pricing-cta-filled" target="_blank" rel="noopener noreferrer">Get Started →</a>
            </div>
            <div className="pricing-card reveal">
              <div className="pricing-name">Peak</div>
              <div className="pricing-price">$24,999</div>
              <div className="pricing-period">Comprehensive engagement</div>
              <div className="pricing-features">
                {['Everything in Standard', 'Full AI program design', 'First AI implementation included', 'AI Officer placement', '90-day implementation support', 'Board-ready AI strategy presentation'].map((f) => (
                  <div key={f} className="pricing-feature">{f}</div>
                ))}
              </div>
              <a href="https://ai-officer.typeform.com/letstalk" className="btn pricing-cta-ghost" target="_blank" rel="noopener noreferrer">Get Started →</a>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials section">
        <div className="container">
          <div className="testimonials-header reveal">
            <span className="section-label">Testimonials</span>
            <h2 className="section-title">What Our Clients Say</h2>
          </div>
        </div>
        <div className="container" style={{ overflow: 'visible' }}>
          <div className="testimonials-viewport" ref={viewportRefA}>
            <div className="testimonials-track" ref={trackRefA}>
              {extTestimonialsA.map((t, i) => (
                <div key={i} className={`testimonial-card t-card-audit${i === activeExtIdxA ? ' active' : ''}`}>
                  <span className="testimonial-quote">&ldquo;</span>
                  <p className="testimonial-text">{t.text}</p>
                  <div className="testimonial-person">
                    <Image src={t.avatar} alt={t.name} width={52} height={52} className="testimonial-avatar" />
                    <div>
                      <div className="testimonial-name">{t.name}</div>
                      <div className="testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="testimonials-nav">
            <div className="testimonials-dots">
              {testimonials.map((_, i) => (
                <button key={i} className={`testimonials-dot${i === currentTestimonialA ? ' active' : ''}`} onClick={() => scrollToTestimonialA(i)} aria-label={`Go to testimonial ${i + 1}`} />
              ))}
            </div>
            <div className="testimonials-arrows">
              <button className="testimonials-arrow" onClick={() => scrollToTestimonialA((currentTestimonialA - 1 + T_COUNT_A) % T_COUNT_A)} aria-label="Previous">
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button className="testimonials-arrow" onClick={() => scrollToTestimonialA((currentTestimonialA + 1) % T_COUNT_A)} aria-label="Next">
                <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18" /></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="contact-blue section">
        <div className="container">
          <div className="contact-blue-inner">
            <div className="reveal">
              <h2 className="section-title" style={{ marginBottom: 16 }}>Ready to Scale AI That Actually Works?</h2>
              <p className="section-sub">Join the companies already seeing real ROI from structured AI programs.</p>
            </div>
            <div className="contact-blue-cta reveal">
              <a href="https://ai-officer.typeform.com/letstalk" className="btn btn-contact" target="_blank" rel="noopener noreferrer">Start Your AI Program →</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

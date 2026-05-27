'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', email: '', company: '', teamSize: '', message: '', website: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('sent')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <main>
      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section className="contact-hero section">
        <div className="container">
          <div className="contact-hero-inner">

            {/* ── Left: copy ── */}
            <div className="contact-hero-left">
              <h1 className="contact-hero-title">Let&rsquo;s Lead AI Together.</h1>
              <p className="contact-hero-sub">
                Start with a free 30-minute audit. We&rsquo;ll map your highest-ROI use case before you spend a dollar.
              </p>

              <div className="contact-checklist">
                <p className="contact-checklist-label">You leave with</p>
                <ul>
                  <li>A clear read on where your business actually stands on AI</li>
                  <li>Your highest-ROI use case — mapped and prioritised</li>
                  <li>A concrete next step, or an honest reason not to take one</li>
                </ul>
              </div>

              <div className="contact-checklist">
                <p className="contact-checklist-label">Right fit if you&rsquo;re</p>
                <ul>
                  <li>A founder or executive ready to lead AI across your organisation</li>
                  <li>A team leader expected to deliver AI results without burning people out</li>
                  <li>A business owner who wants real efficiency gains — not just hype</li>
                </ul>
              </div>

              <p className="contact-hero-foot">
                Prefer to read first?{' '}
                <Link href="/ai-programs">See our AI Programs</Link>
                {' '}or{' '}
                <Link href="/caio-leadership">explore the AI Officer Certification</Link>.
              </p>
            </div>

            {/* ── Right: form ── */}
            <div className="contact-hero-right">
              {status === 'sent' ? (
                <div className="contact-success">
                  <div className="contact-success-icon">✓</div>
                  <h2>On it. Reply within one business day.</h2>
                  <p>
                    If it&rsquo;s a fit, we&rsquo;ll send a short Calendly with a few times. If it&rsquo;s not, we&rsquo;ll tell you and point you somewhere better.
                  </p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <p className="contact-form-eyebrow">30-minute consultation · With the Edge8 team</p>

                  <div className="contact-field">
                    <label htmlFor="name">Full name <span aria-hidden>*</span></label>
                    <input id="name" name="name" type="text" required autoComplete="name" value={form.name} onChange={handleChange} />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="email">Work email <span aria-hidden>*</span></label>
                    <input id="email" name="email" type="email" required autoComplete="email" value={form.email} onChange={handleChange} />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="company">Company <span aria-hidden>*</span></label>
                    <input id="company" name="company" type="text" required autoComplete="organization" value={form.company} onChange={handleChange} />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="teamSize">Team size <span aria-hidden>*</span></label>
                    <select id="teamSize" name="teamSize" required value={form.teamSize} onChange={handleChange}>
                      <option value="" disabled>Select one…</option>
                      <option value="1 - 10">1 – 10</option>
                      <option value="11 - 50">11 – 50</option>
                      <option value="51 - 200">51 – 200</option>
                      <option value="200+">200+</option>
                    </select>
                  </div>

                  <div className="contact-field">
                    <label htmlFor="message">What do you want to work on?</label>
                    <textarea id="message" name="message" rows={4} value={form.message} onChange={handleChange} />
                  </div>

                  {/* Honeypot */}
                  <input type="text" name="website" value={form.website} onChange={handleChange} tabIndex={-1} aria-hidden style={{ display: 'none' }} />

                  {status === 'error' && (
                    <p className="contact-error">Something went wrong — please try again or email us directly at <a href="mailto:hello@edge8.ai">hello@edge8.ai</a>.</p>
                  )}

                  <button type="submit" className="btn btn-primary contact-submit" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Book the Audit →'}
                  </button>

                  <p className="contact-form-note">Reply within 1 business day</p>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}

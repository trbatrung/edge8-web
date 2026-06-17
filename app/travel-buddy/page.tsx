'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function TravelBuddyPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [form, setForm] = useState({
    name: '', email: '', chapter: '', event: '',
    dates: '', groupSize: '', notes: '', website: '',
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/travel-buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main>

      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section className="svc-hero">
        <div className="svc-hero-bg" />
        <div className="svc-hero-grid" />
        <div className="container">
          <div className="svc-hero-inner" style={{ gridTemplateColumns: '1fr', maxWidth: 720 }}>
            <div className="svc-hero-text">
              <div className="page-hero-urgency" style={{ marginBottom: 20 }}>
                For EO &amp; YPO members who travel to grow.
              </div>
              <h1>Travel Sorted.<br />Forums Attended.<br />Business Grown.</h1>
              <p className="svc-hero-sub">
                Travel Buddy handles every detail of your EO and YPO event travel — flights, hotels, transfers, visas, and group logistics — so you show up ready to connect, not exhausted from the journey.
              </p>
              <a href="#tb-form" className="btn btn-contact">Plan My Next Trip →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE PROBLEM ════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="reveal">
            <span className="section-label">The Problem</span>
            <h2 className="section-title">EO &amp; YPO Travel Is Complicated.<br />It Doesn&rsquo;t Have to Be Your Problem.</h2>
            <p className="section-sub" style={{ marginTop: 16 }}>
              You&rsquo;re running a company. The last thing you have is 10 hours to coordinate group flights, chase visa paperwork, and negotiate hotel blocks.
            </p>
          </div>
          <div className="problem-cards" style={{ marginTop: 48 }}>
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="problem-card-title">The Group Coordination Trap</div>
              <p className="problem-card-desc">
                Ten founders, ten schedules, ten departure cities. Coordinating group travel across a busy chapter takes hours of back-and-forth that nobody has time for.
              </p>
            </div>
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="problem-card-title">Last-Minute Everything</div>
              <p className="problem-card-desc">
                Venues shift, speakers cancel, event dates move. One change cascades into a dozen rebooking headaches — unless someone is managing it in real time.
              </p>
            </div>
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <div className="problem-card-title">The Visa Maze</div>
              <p className="problem-card-desc">
                EO University, EO Alchemy, regional conferences — they cross borders. Getting the right documents to the right people at the right time is a full-time job.
              </p>
            </div>
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div className="problem-card-title">You Arrive Exhausted</div>
              <p className="problem-card-desc">
                Fourteen-hour flight, wrong hotel, no airport transfer sorted. Your first forum session is in four hours. Travel should set you up to lead, not recover.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHAT WE HANDLE ════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--tint)' }}>
        <div className="container">
          <div className="reveal">
            <span className="section-label">What We Handle</span>
            <h2 className="section-title">Everything Between<br />&ldquo;I&rsquo;m Attending&rdquo; and &ldquo;I&rsquo;m There&rdquo;</h2>
            <p className="section-sub" style={{ marginTop: 16 }}>
              One point of contact for your entire group trip. We coordinate everything so your chapter shows up together, on time, and ready.
            </p>
          </div>

          <div className="tb-handles-grid">
            {[
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12"/><path d="M12 2a10 10 0 0 1 10 10"/><polyline points="12 6 12 12 16 14"/></svg>,
                title: 'Flight Coordination',
                desc: 'Group bookings, layover management, seat preferences, and flexibility when plans change.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
                title: 'Hotel Blocks',
                desc: 'Room allocation for the whole group, near the venue, within budget, confirmed in advance.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h5l3 3v5h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
                title: 'Airport Transfers',
                desc: 'Ground transport from arrival to hotel to venue — for every person in your group.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
                title: 'Visa Support',
                desc: 'Document checklists, application guidance, and deadline tracking for every destination.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title: 'Event Registration',
                desc: 'Group registrations, forum assignments, and confirmation tracking across the chapter.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                title: 'Real-Time Support',
                desc: 'WhatsApp-based coordination during the trip. Someone always available when things shift.',
              },
            ].map((item, i) => (
              <div key={i} className="tb-handle-card reveal">
                <div className="tb-handle-icon">{item.icon}</div>
                <h3 className="tb-handle-title">{item.title}</h3>
                <p className="tb-handle-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}>
            <span className="section-label">How It Works</span>
            <h2 className="section-title" style={{ marginTop: 12 }}>Three Steps from &ldquo;We&rsquo;re Going&rdquo;<br />to &ldquo;We&rsquo;re There&rdquo;</h2>
          </div>

          <div className="careers-process-steps">
            <div className="careers-process-step reveal">
              <div className="careers-step-num">1</div>
              <h3 className="careers-step-title">Share Your Event Details</h3>
              <p className="careers-step-desc">
                Tell us the event, destination, dates, and how many people are travelling. Fill in the form below — it takes under three minutes.
              </p>
            </div>
            <div className="careers-process-step reveal">
              <div className="careers-step-num">2</div>
              <h3 className="careers-step-title">We Build the Plan</h3>
              <p className="careers-step-desc">
                We come back with a full itinerary — flights, hotels, transfers, visa requirements, and a cost breakdown. You approve or adjust.
              </p>
            </div>
            <div className="careers-process-step reveal">
              <div className="careers-step-num">3</div>
              <h3 className="careers-step-title">You Show Up</h3>
              <p className="careers-step-desc">
                Everything is confirmed. Your group has what they need. You land, get picked up, check in, and walk into the forum ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INQUIRY FORM ════════════════════════════════════════ */}
      <section className="section" id="tb-form" style={{ background: 'var(--tint)' }}>
        <div className="container">
          <div className="tb-form-wrap">
            <div className="tb-form-left reveal">
              <span className="section-label">Plan Your Trip</span>
              <h2 className="section-title" style={{ marginTop: 12 }}>Tell Us About<br />Your Next Event</h2>
              <p className="section-sub" style={{ marginTop: 16 }}>
                Fill in the details and we&rsquo;ll come back with a full plan within one business day. No commitment, no cost for the first conversation.
              </p>
              <ul className="tb-form-promise">
                <li>Reply within one business day</li>
                <li>Full itinerary draft before you commit</li>
                <li>One point of contact for the whole trip</li>
              </ul>
            </div>

            <div className="tb-form-right reveal">
              {status === 'sent' ? (
                <div className="contact-success">
                  <div className="contact-success-icon">✓</div>
                  <h2>Got it. Itinerary draft incoming.</h2>
                  <p>
                    We&rsquo;ll review your event details and come back with a full travel plan within one business day.
                  </p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="contact-field-row">
                    <div className="contact-field">
                      <label htmlFor="tb-name">Full name <span aria-hidden>*</span></label>
                      <input id="tb-name" name="name" type="text" required autoComplete="name" value={form.name} onChange={handleChange} />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="tb-email">Email <span aria-hidden>*</span></label>
                      <input id="tb-email" name="email" type="email" required autoComplete="email" value={form.email} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="contact-field-row">
                    <div className="contact-field">
                      <label htmlFor="tb-chapter">EO / YPO Chapter <span aria-hidden>*</span></label>
                      <input id="tb-chapter" name="chapter" type="text" required placeholder="e.g. EO Vietnam" value={form.chapter} onChange={handleChange} />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="tb-event">Event / Destination <span aria-hidden>*</span></label>
                      <input id="tb-event" name="event" type="text" required placeholder="e.g. EO University 2026, Bangkok" value={form.event} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="contact-field-row">
                    <div className="contact-field">
                      <label htmlFor="tb-dates">Travel dates</label>
                      <input id="tb-dates" name="dates" type="text" placeholder="e.g. Sep 12–16, 2026" value={form.dates} onChange={handleChange} />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="tb-groupSize">Group size</label>
                      <select id="tb-groupSize" name="groupSize" value={form.groupSize} onChange={handleChange}>
                        <option value="" disabled>Select…</option>
                        <option value="Solo">Just me</option>
                        <option value="2–5">2–5 people</option>
                        <option value="6–10">6–10 people</option>
                        <option value="10+">10+ people</option>
                      </select>
                    </div>
                  </div>

                  <div className="contact-field">
                    <label htmlFor="tb-notes">Anything we should know?</label>
                    <textarea id="tb-notes" name="notes" rows={3} placeholder="Special requirements, preferred airlines, dietary needs, etc." value={form.notes} onChange={handleChange} />
                  </div>

                  {/* Honeypot */}
                  <input type="text" name="website" value={form.website} onChange={handleChange} tabIndex={-1} aria-hidden style={{ display: 'none' }} />

                  {status === 'error' && (
                    <p className="contact-error">Something went wrong. Email us directly at <a href="mailto:hello@edge8.ai">hello@edge8.ai</a>.</p>
                  )}

                  <button type="submit" className="btn btn-primary contact-submit" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Plan My Trip →'}
                  </button>
                  <p className="contact-form-note">Reply within 1 business day</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA FOOTER ════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--dark)', textAlign: 'center' }}>
        <div className="container">
          <div className="reveal" style={{ maxWidth: 560, margin: '0 auto' }}>
            <span className="section-label" style={{ background: 'rgba(40,123,232,0.15)', color: 'rgba(255,255,255,0.75)' }}>
              Already a client?
            </span>
            <h2 className="section-title" style={{ color: 'var(--white)', marginTop: 16 }}>
              Travel Buddy is part of<br />every Edge8 engagement.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 16, lineHeight: 1.75, margin: '20px 0 40px' }}>
              If you&rsquo;re already working with us, your next event trip is already covered. Reach out to your program lead or book a conversation to get started.
            </p>
            <Link href="/contact" className="btn btn-secondary">Book a Conversation →</Link>
          </div>
        </div>
      </section>

    </main>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { pinnedVideo, gridVideos, type ResolvedVideo } from '@/lib/videoData'
import WatchPlayerModal from '@/components/WatchPlayerModal'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export default function WatchPage() {
  const [active, setActive] = useState<ResolvedVideo | null>(null)

  return (
    <main>
      {/* ═══ HERO + VIDEO OF THE WEEK ═══════════════════════════ */}
      <section className="wv-hero">
        <div className="container">
          <div className="wv-hero-inner">
            <span className="wv-eyebrow">▶ Edge8 Watch</span>
            <h1 className="section-title" style={{ color: '#fff' }}>Videos</h1>
            <p className="wv-hero-sub">
              AI leadership, strategy, and implementation — distilled into short watches, drawn from the Edge8 blog.
            </p>

            {pinnedVideo && (
              <div className="wv-pinned">
                <span className="wv-pinned-label">📌 Video of the Week</span>
                <button
                  className="wv-featured-card"
                  onClick={() => setActive(pinnedVideo ?? null)}
                  aria-label={`Play ${pinnedVideo.post.title}`}
                >
                  <div className="wv-featured-thumb">
                    <Image
                      src={pinnedVideo.post.image}
                      alt={pinnedVideo.post.title}
                      width={600}
                      height={338}
                      className="wv-featured-img"
                    />
                    <span className="wv-play-badge" aria-hidden="true"><PlayIcon /></span>
                  </div>
                  <div className="wv-featured-body">
                    <span className="wv-cat">{pinnedVideo.post.category}</span>
                    <p className="wv-date">{fmtDate(pinnedVideo.post.date)}</p>
                    <h2 className="wv-featured-title">{pinnedVideo.post.title}</h2>
                    <p className="wv-featured-excerpt">{pinnedVideo.post.excerpt}</p>
                    <span className="wv-featured-more">▶ Watch now</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ NEW VIDEOS ═════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="wv-section-head">
            <h2 className="wv-section-title">New Videos</h2>
            <p className="wv-section-sub">Fresh watches from across our writing on AI in business.</p>
          </div>

          <div className="wv-grid">
            {gridVideos.map((v) => (
              <button
                key={v.slug}
                className="wv-card"
                onClick={() => setActive(v)}
                aria-label={`Play ${v.post.title}`}
              >
                <div className="wv-card-thumb">
                  <Image src={v.post.image} alt={v.post.title} fill style={{ objectFit: 'cover' }} />
                  <span className="wv-play-badge" aria-hidden="true"><PlayIcon /></span>
                </div>
                <div className="wv-card-body">
                  <span className="wv-cat">{v.post.category}</span>
                  <span className="wv-date">{fmtDate(v.post.date)}</span>
                  <div className="wv-card-title">{v.post.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HAVE AN IDEA? CTA ══════════════════════════════════ */}
      <section className="section wv-idea">
        <div className="container">
          <div className="wv-idea-inner">
            <div className="wv-idea-text">
              <span className="wv-idea-badge">💡 Pitch us</span>
              <h2 className="section-title">Have an idea for a video?</h2>
              <p>
                Tell us what you want to see next — a topic, a burning question, a teardown. If it helps
                founders get Tech-Forward, we&apos;ll make it.
              </p>
            </div>
            <div className="wv-idea-btns">
              <Link href="/contact" className="btn btn-mint">Get in touch →</Link>
              <a href="mailto:hello@edge8.ai" className="btn wv-btn-ghost">hello@edge8.ai</a>
            </div>
          </div>
        </div>
      </section>

      <WatchPlayerModal video={active} onClose={() => setActive(null)} />
    </main>
  )
}

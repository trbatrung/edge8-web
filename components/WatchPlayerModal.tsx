'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ResolvedVideo } from '@/lib/videoData'

// On-site player. YouTube is the source, but playback stays on Edge8 — an inline
// iframe with minimal chrome, never a link out to youtube.com. When a video has
// no ID yet, we show a "coming soon" poster state that points to the article.
export default function WatchPlayerModal({
  video,
  onClose,
}: {
  video: ResolvedVideo | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!video) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden' // lock background scroll
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [video, onClose])

  if (!video) return null

  const { post, youtubeId } = video

  return (
    <div
      className="wv-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
    >
      <div className="wv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wv-modal-close" onClick={onClose} aria-label="Close video">
          ×
        </button>

        <div className="wv-modal-stage">
          {youtubeId ? (
            <iframe
              className="wv-modal-iframe"
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={post.title}
              allow="autoplay; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="wv-modal-poster">
              <Image src={post.image} alt={post.title} fill style={{ objectFit: 'cover' }} />
              <div className="wv-modal-poster-overlay">
                <span className="wv-soon-badge">Video coming soon</span>
                <p>We&apos;re producing this one. In the meantime, read the article it&apos;s based on.</p>
                <Link href={`/post/${post.slug}`} className="btn btn-mint" onClick={onClose}>
                  Read the article →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="wv-modal-meta">
          <span className="wv-cat">{post.category}</span>
          <h3 className="wv-modal-title">{post.title}</h3>
          <span className="wv-now-playing">Now playing on Edge8</span>
        </div>
      </div>
    </div>
  )
}

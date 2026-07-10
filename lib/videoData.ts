// Client-safe data for the /watch video hub.
//
// Videos are DERIVED FROM BLOG POSTS: the poster is the post's blog image, and
// title / date / category / excerpt come straight from `postData.ts` so there is
// a single source of truth. To add a video you only reference a blog slug here.
//
// `youtubeId` is null until a real embed exists. While null, the card still
// renders (poster + play affordance) and the on-site player shows a
// "coming soon" state that links to the source article. Drop an ID in to make
// that video play inline — no other change needed.
import { allPosts, type PostMeta } from './postData'

export interface VideoMeta {
  /** References a blog post `slug` in postData.ts */
  slug: string
  /** YouTube video ID, or null until produced */
  youtubeId: string | null
}

// Curated list, in display order. The 10 most impactful posts, categorized.
// Pin is chosen by `pinnedSlug` below (not by position), so reordering is safe.
export const curatedVideos: VideoMeta[] = [
  { slug: 'why-every-business-needs-a-chief-ai-officer-leadership-trumps-technology', youtubeId: null },
  { slug: '2026-ai-trends-5-game-changing-shifts-that-will-define-business-success', youtubeId: null },
  { slug: 'the-case-for-ai-co-ceos-and-ai-leadership-why-every-leader-needs-a-digital-decision-partner', youtubeId: null },
  { slug: 'video-3-0-ai-powered-video-communication-for-executives', youtubeId: null },
  { slug: 'turn-your-story-into-a-personal-brand-with-ai-agents-in-just-one-hour', youtubeId: null },
  { slug: 'the-ai-implementation-strategy-divide-why-smart-entrepreneurs-are-failing', youtubeId: null },
  { slug: 'ai-data-strategy-why-data-moats-beat-model-wars-in-2025', youtubeId: null },
  { slug: '5-keys-to-reduce-ai-hallucinations-and-build-reliable-business-systems', youtubeId: null },
  { slug: 'your-next-ai-hire-isnt-a-person', youtubeId: null },
  { slug: 'vietnam-ai-silicon-valley-of-southeast-asia', youtubeId: null },
]

/** The pinned "Video of the Week". */
export const pinnedSlug = 'why-every-business-needs-a-chief-ai-officer-leadership-trumps-technology'

/** A curated video with its blog post resolved for rendering. */
export interface ResolvedVideo extends VideoMeta {
  post: PostMeta
}

function resolve(v: VideoMeta): ResolvedVideo | null {
  const post = allPosts.find((p) => p.slug === v.slug)
  if (!post) return null // slug typo / post removed — skip rather than crash
  return { ...v, post }
}

export const resolvedVideos: ResolvedVideo[] = curatedVideos
  .map(resolve)
  .filter((v): v is ResolvedVideo => v !== null)

export const pinnedVideo: ResolvedVideo | undefined =
  resolvedVideos.find((v) => v.slug === pinnedSlug)

/** Everything except the pinned video, for the "New Videos" grid. */
export const gridVideos: ResolvedVideo[] = resolvedVideos.filter(
  (v) => v.slug !== pinnedSlug
)

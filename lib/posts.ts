import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import { allPosts, PostMeta } from './postData'

export type { PostMeta }
export { allPosts }

export interface Post extends PostMeta {
  contentHtml: string
}

const contentDir = path.join(process.cwd(), 'content', 'blog')

export async function getPostDataBySlug(slug: string): Promise<Post | null> {
  const post = allPosts.find((p) => p.slug === slug)
  if (!post) return null

  const fullPath = path.join(contentDir, `${post.mdFile}.md`)

  if (!fs.existsSync(fullPath)) {
    return { ...post, contentHtml: '<p>Content coming soon.</p>' }
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { content: rawContent } = matter(fileContents)

  // Strip the title (H1) and metadata block (Published, Source, Category, etc.)
  // that appears before the first --- separator in all post markdown files
  const hrIndex = rawContent.search(/\n---+\s*\n/)
  const content = hrIndex !== -1 ? rawContent.slice(hrIndex).replace(/^---+\s*\n/, '') : rawContent

  // sanitize:false lets first-party markdown use raw HTML — <figure>/<figcaption>
  // exhibit framing and the <details> FAQ accordion. Pure-markdown posts are unaffected.
  const processedContent = await remark().use(remarkHtml, { sanitize: false }).process(content)
  const contentHtml = processedContent.toString()

  return { ...post, contentHtml }
}

export function getAllSlugs(): string[] {
  return allPosts.map((p) => p.slug)
}

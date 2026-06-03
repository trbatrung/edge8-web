import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'

const jobsDir = path.join(process.cwd(), 'content', 'jobs')

export type JobPost = {
  slug: string
  title: string
  department: string
  location: string
  type: string
  posted: string
  excerpt: string
  applyEmail: string
  featured: boolean
  active: boolean
  contentHtml: string
}

export async function getActiveJobs(): Promise<JobPost[]> {
  if (!fs.existsSync(jobsDir)) return []

  // Files starting with _ are templates — excluded from the page
  const files = fs.readdirSync(jobsDir).filter(
    (f) => f.endsWith('.md') && !f.startsWith('_')
  )
  if (files.length === 0) return []

  const jobs = await Promise.all(
    files.map(async (filename) => {
      const slug = filename.replace(/\.md$/, '')
      const fullPath = path.join(jobsDir, filename)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      const processedContent = await remark().use(remarkHtml).process(content)
      const contentHtml = processedContent.toString()

      return {
        slug,
        title: data.title ?? '',
        department: data.department ?? 'General',
        location: data.location ?? 'Remote',
        type: data.type ?? 'Full-time',
        posted: data.posted ?? '',
        excerpt: data.excerpt ?? '',
        applyEmail: data.applyEmail ?? 'hello@edge8.ai',
        featured: data.featured ?? false,
        active: data.active ?? true,
        contentHtml,
      } as JobPost
    })
  )

  return jobs
    .filter((j) => j.active)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return new Date(b.posted).getTime() - new Date(a.posted).getTime()
    })
}

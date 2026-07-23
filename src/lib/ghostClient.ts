export const GHOST_API_URL = 'https://candygetshandy.com'
export const GHOST_CONTENT_API_KEY = '8529f4cebea1e3e6b43e6132fb'

// Pins the Content API response format to the site's actual Ghost version (6.42.0)
const GHOST_API_VERSION_HEADER = { 'Accept-Version': 'v6.42' }

export interface GhostTag {
  id: string
  name: string
  slug: string
}

export interface GhostPost {
  id: string
  slug: string
  title: string
  published_at: string
  html?: string
  custom_excerpt?: string
  tags?: GhostTag[]
}

interface GhostPostsResponse {
  posts: GhostPost[]
}

export async function getPostsByTag(
  tag: string,
  limit = 15,
  publishedAfter?: string,
  includeTags = false,
): Promise<GhostPost[]> {
  let filter = `tag:${tag}`
  if (publishedAfter) {
    filter += `+published_at:>'${publishedAfter}'`
  }
  let url = `${GHOST_API_URL}/ghost/api/content/posts/?key=${GHOST_CONTENT_API_KEY}&filter=${encodeURIComponent(filter)}&limit=${limit}&fields=id,slug,title,published_at,custom_excerpt`
  if (includeTags) {
    url += `&include=tags`
  }
  const response = await fetch(url, { headers: GHOST_API_VERSION_HEADER })
  if (!response.ok) throw new Error(`Ghost API error: ${response.status}`)

  const data: GhostPostsResponse = await response.json()
  return data.posts
}

export async function getPostBySlug(slug: string): Promise<GhostPost> {
  const url = `${GHOST_API_URL}/ghost/api/content/posts/slug/${slug}/?key=${GHOST_CONTENT_API_KEY}&fields=id,slug,title,published_at,html`
  const response = await fetch(url, { headers: GHOST_API_VERSION_HEADER })
  if (!response.ok) throw new Error(`Ghost API error: ${response.status}`)

  const data: GhostPostsResponse = await response.json()
  return data.posts[0]
}

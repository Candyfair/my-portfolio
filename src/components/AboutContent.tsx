import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { getPostBySlug, getPostsByTag } from '../lib/ghostClient'
import type { GhostPost } from '../lib/ghostClient'
import { filterGhostContentHtml } from '../lib/ghostContentFilters'
import { ABOUT_CONTENT } from '../data/aboutContent'
import { PanelHeader } from './PanelHeader'

const ABOUT_TAG = 'portfolio-about'

type AboutStatus = 'loading' | 'success' | 'empty' | 'error'

const loadingWrapperStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '160px',
}

const emptyStyle: CSSProperties = {
  margin: '8px 0 0',
}

const errorStyle: CSSProperties = {
  color: 'var(--color-error)',
  margin: '8px 0 0',
}

export function AboutContent() {
  const [status, setStatus] = useState<AboutStatus>('loading')
  const [post, setPost] = useState<GhostPost | null>(null)

  useEffect(() => {
    let cancelled = false

    getPostsByTag(ABOUT_TAG, 1)
      .then(posts => {
        if (cancelled) return undefined
        if (posts.length === 0) {
          setStatus('empty')
          return undefined
        }
        return getPostBySlug(posts[0].slug).then(fullPost => {
          if (cancelled) return
          setPost(fullPost)
          setStatus('success')
        })
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <PanelHeader nodeId={ABOUT_CONTENT.nodeLabel} />

      {status === 'loading' && (
        <div style={loadingWrapperStyle}>
          <span className="articles-spinner" role="status" aria-label={ABOUT_CONTENT.loadingMessage} />
        </div>
      )}

      {status === 'success' && post && (
        <div className="article-body" dangerouslySetInnerHTML={{ __html: filterGhostContentHtml(post.html ?? '') }} />
      )}

      {status === 'empty' && <p style={emptyStyle}>{ABOUT_CONTENT.emptyMessage}</p>}

      {status === 'error' && <p style={errorStyle}>{ABOUT_CONTENT.errorMessage}</p>}
    </div>
  )
}

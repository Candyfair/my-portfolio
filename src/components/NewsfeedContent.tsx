import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { getPostsByTag } from '../lib/ghostClient'
import type { GhostPost } from '../lib/ghostClient'
import { formatPostDate } from '../lib/formatPostDate'
import { NEWSFEED_CONTENT } from '../data/newsfeedContent'
import { useIsMobile } from '../hooks/useIsMobile'
import { PanelHeader } from './PanelHeader'

const NEWSFEED_TAG = 'news'
const NEWSFEED_POST_LIMIT = 6

type NewsfeedStatus = 'loading' | 'success' | 'error'

const wrapperStyle: CSSProperties = {
  background: 'var(--newsfeed-bg)',
  border: '1px solid var(--newsfeed-accent)',
  padding: '10px 12px',
  color: 'var(--newsfeed-accent)',
}

// Bleeds past wrapperStyle's horizontal padding (12px) so the border reaches the terminal's edges
const titleRowStyle: CSSProperties = {
  marginLeft: '-12px',
  marginRight: '-12px',
  marginTop: '-10px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingBottom: '8px',
  borderBottom: '2px solid var(--newsfeed-accent)',
}

const titleStyle: CSSProperties = {
  fontWeight: 700,
  margin: 0,
  textAlign: 'center',
}

const dotsRowStyle: CSSProperties = {
  marginBottom: '8px',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const itemStyleDesktop: CSSProperties = {
  display: 'flex',
  gap: '10px',
}

const itemStyleMobile: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
}

const dateStyle: CSSProperties = {
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const emptyStyle: CSSProperties = {
  margin: 0,
}

const errorStyle: CSSProperties = {
  color: 'var(--color-error)',
  margin: 0,
}

const legendStyle: CSSProperties = {
  color: 'var(--newsfeed-legend)',
  marginTop: '8px',
  marginBottom: 0,
  fontSize: '0.9em',
  textAlign: 'center',
}

// Base color comes from .newsfeed-legend-link in index.css, not inline — an inline
// color would always win over the :hover rule regardless of CSS specificity.
const legendLinkStyle: CSSProperties = {
  fontWeight: 700,
}

export function NewsfeedContent() {
  const [status, setStatus] = useState<NewsfeedStatus>('loading')
  const [posts, setPosts] = useState<GhostPost[]>([])
  const isMobile = useIsMobile()

  useEffect(() => {
    let cancelled = false

    getPostsByTag(NEWSFEED_TAG, NEWSFEED_POST_LIMIT)
      .then(result => {
        if (cancelled) return
        setPosts(result)
        setStatus('success')
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
    <div style={{ fontSize: isMobile ? '11px' : undefined }}>
      <PanelHeader nodeId="newsfeed" />

      <div style={wrapperStyle}>
        <div style={titleRowStyle}>
          <p style={titleStyle}>{NEWSFEED_CONTENT.title}</p>
        </div>

        <div style={dotsRowStyle}>
          <span className="newsfeed-dots" />
        </div>

        {status === 'success' && posts.length > 0 && (
          <ul style={listStyle}>
            {posts.map(post => (
              <li key={post.id} style={isMobile ? itemStyleMobile : itemStyleDesktop}>
                <span style={dateStyle}>{formatPostDate(post.published_at)}</span>
                <span>{post.title}</span>
              </li>
            ))}
          </ul>
        )}

        {status === 'success' && posts.length === 0 && (
          <p style={emptyStyle}>{NEWSFEED_CONTENT.emptyMessage}</p>
        )}

        {status === 'error' && <p style={errorStyle}>{NEWSFEED_CONTENT.errorMessage}</p>}
      </div>

      <p style={legendStyle}>
        {NEWSFEED_CONTENT.legendPrefix}{' '}
        <a
          href={NEWSFEED_CONTENT.legendLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="newsfeed-legend-link"
          style={legendLinkStyle}
        >
          {NEWSFEED_CONTENT.legendLinkLabel}
        </a>
      </p>
    </div>
  )
}

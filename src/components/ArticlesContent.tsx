import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { getPostsByTag } from '../lib/ghostClient'
import type { GhostPost } from '../lib/ghostClient'
import { formatPostDate } from '../lib/formatPostDate'
import { ARTICLES_CONTENT } from '../data/articlesContent'
import { useIsMobile } from '../hooks/useIsMobile'

const ARTICLES_TAG = 'ux-coding'
const ARTICLES_POST_LIMIT = 20

type ArticlesStatus = 'loading' | 'success' | 'error'

const wrapperStyle: CSSProperties = {
  padding: '6px 10px',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: 'var(--articles-table-bg)',
}

const headerCellStyle: CSSProperties = {
  textAlign: 'left',
  fontWeight: 700,
  padding: '4px 8px',
  borderBottom: '1px solid var(--articles-table-border)',
}

const headerCellDividerStyle: CSSProperties = {
  borderRight: '1px solid var(--articles-table-border)',
}

const dateHeaderCellStyle: CSSProperties = {
  whiteSpace: 'nowrap',
}

const cellStyle: CSSProperties = {
  padding: '4px 8px',
}

const cellDividerStyle: CSSProperties = {
  borderRight: '1px solid var(--articles-table-border)',
}

const hashCellStyle: CSSProperties = {
  verticalAlign: 'top',
}

const dateCellStyle: CSSProperties = {
  whiteSpace: 'nowrap',
}

const rowStyle: CSSProperties = {
  cursor: 'pointer',
}

const emptyStyle: CSSProperties = {
  margin: '8px 0 0',
}

const errorStyle: CSSProperties = {
  color: 'var(--color-error)',
  margin: '8px 0 0',
}

export function ArticlesContent() {
  const [status, setStatus] = useState<ArticlesStatus>('loading')
  const [posts, setPosts] = useState<GhostPost[]>([])
  const isMobile = useIsMobile()

  useEffect(() => {
    let cancelled = false

    getPostsByTag(ARTICLES_TAG, ARTICLES_POST_LIMIT)
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
    <div>
      <div style={wrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, ...headerCellDividerStyle }}>{ARTICLES_CONTENT.columnHash}</th>
              <th style={{ ...headerCellStyle, ...(!isMobile ? headerCellDividerStyle : {}) }}>{ARTICLES_CONTENT.columnTitle}</th>
              {!isMobile && (
                <th style={{ ...headerCellStyle, ...dateHeaderCellStyle }}>{ARTICLES_CONTENT.columnDate}</th>
              )}
            </tr>
          </thead>

          {status === 'success' && posts.length > 0 && (
            <tbody>
              {posts.map((post, index) => (
                // TODO: wire to article detail view, deferred to a future session
                <tr key={post.id} className="articles-row" style={rowStyle}>
                  <td style={{ ...cellStyle, ...cellDividerStyle, ...hashCellStyle }}>{index + 1}</td>
                  <td style={{ ...cellStyle, ...(!isMobile ? cellDividerStyle : {}) }}>{post.title}</td>
                  {!isMobile && (
                    <td style={{ ...cellStyle, ...dateCellStyle }}>{formatPostDate(post.published_at)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          )}
        </table>

        {status === 'success' && posts.length === 0 && (
          <p style={emptyStyle}>{ARTICLES_CONTENT.emptyMessage}</p>
        )}

        {status === 'error' && <p style={errorStyle}>{ARTICLES_CONTENT.errorMessage}</p>}
      </div>
    </div>
  )
}

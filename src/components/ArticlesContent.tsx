import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { getPostBySlug, getPostsByTag } from '../lib/ghostClient'
import type { GhostPost } from '../lib/ghostClient'
import { formatPostDate } from '../lib/formatPostDate'
import { ARTICLES_CONTENT } from '../data/articlesContent'
import { useIsMobile } from '../hooks/useIsMobile'

const ARTICLES_TAG = 'ux-coding'
const ARTICLES_POST_LIMIT = 20

type ArticlesStatus = 'loading' | 'success' | 'error'
type ArticlesView = 'list' | 'detail'

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

const titleCellStyle: CSSProperties = {
  padding: 0,
}

const titleButtonStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  border: 'none',
  background: 'none',
  padding: '4px 8px',
  margin: 0,
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
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

const backLinkStyle: CSSProperties = {
  display: 'block',
  border: 'none',
  background: 'none',
  padding: 0,
  margin: '0 0 12px',
  font: 'inherit',
  cursor: 'pointer',
}

const detailTitleStyle: CSSProperties = {
  fontWeight: 700,
  margin: '0 0 4px',
}

const detailDateStyle: CSSProperties = {
  margin: '0 0 12px',
  whiteSpace: 'nowrap',
}

export function ArticlesContent() {
  const [status, setStatus] = useState<ArticlesStatus>('loading')
  const [posts, setPosts] = useState<GhostPost[]>([])
  const [view, setView] = useState<ArticlesView>('list')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [detailStatus, setDetailStatus] = useState<ArticlesStatus>('loading')
  const [detailPost, setDetailPost] = useState<GhostPost | null>(null)
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

  useEffect(() => {
    if (!selectedSlug) return

    let cancelled = false

    getPostBySlug(selectedSlug)
      .then(result => {
        if (cancelled) return
        setDetailPost(result)
        setDetailStatus('success')
      })
      .catch(() => {
        if (cancelled) return
        setDetailStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [selectedSlug])

  function openArticle(slug: string) {
    if (slug !== selectedSlug) {
      setDetailStatus('loading')
      setDetailPost(null)
    }
    setSelectedSlug(slug)
    setView('detail')
  }

  function backToList() {
    setView('list')
  }

  if (view === 'detail') {
    return (
      <div style={wrapperStyle}>
        <button
          type="button"
          className="articles-back-link"
          style={backLinkStyle}
          onClick={backToList}
        >
          {ARTICLES_CONTENT.backLinkLabel}
        </button>

        {detailStatus === 'loading' && <p style={emptyStyle}>{ARTICLES_CONTENT.detailLoadingMessage}</p>}

        {detailStatus === 'success' && detailPost && (
          <article>
            <h2 style={detailTitleStyle}>{detailPost.title}</h2>
            <p style={detailDateStyle}>{formatPostDate(detailPost.published_at)}</p>
            <div className="article-body" dangerouslySetInnerHTML={{ __html: detailPost.html ?? '' }} />
          </article>
        )}

        {detailStatus === 'error' && <p style={errorStyle}>{ARTICLES_CONTENT.detailErrorMessage}</p>}
      </div>
    )
  }

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
                <tr key={post.id} className="articles-row" style={rowStyle} onClick={() => openArticle(post.slug)}>
                  <td style={{ ...cellStyle, ...cellDividerStyle, ...hashCellStyle }}>{index + 1}</td>
                  <td style={{ ...cellStyle, ...titleCellStyle, ...(!isMobile ? cellDividerStyle : {}) }}>
                    <button type="button" style={titleButtonStyle} onClick={() => openArticle(post.slug)}>
                      {post.title}
                    </button>
                  </td>
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

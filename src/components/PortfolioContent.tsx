import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { getPostBySlug, getPostsByTag } from '../lib/ghostClient';
import type { GhostPost } from '../lib/ghostClient';
import { getProjectCompany, getProjectYear } from '../lib/portfolioTagParsing';
import { PORTFOLIO_CONTENT } from '../data/portfolioContent';
import { PanelHeader } from './PanelHeader';

const PORTFOLIO_TAG = 'portfolio';
const PORTFOLIO_POST_LIMIT = 20;
const PORTFOLIO_SKELETON_ROW_COUNT = 5;

type PortfolioStatus = 'loading' | 'success' | 'error';
type PortfolioView = 'list' | 'detail';

const wrapperStyle: CSSProperties = {
  padding: '6px 0',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: 'var(--articles-table-bg)',
};

const headerCellStyle: CSSProperties = {
  textAlign: 'left',
  fontWeight: 700,
  padding: '4px 8px',
  borderBottom: '1px solid var(--articles-table-border)',
};

const headerCellDividerStyle: CSSProperties = {
  borderRight: '1px solid var(--articles-table-border)',
};

const cellStyle: CSSProperties = {
  padding: '4px 8px',
  verticalAlign: 'top',
};

const cellDividerStyle: CSSProperties = {
  borderRight: '1px solid var(--articles-table-border)',
};

const projectCellStyle: CSSProperties = {
  padding: 0,
};

const projectButtonStyle: CSSProperties = {
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
};

const hashCellStyle: CSSProperties = {
  verticalAlign: 'top',
};

const companyCellStyle: CSSProperties = {
  whiteSpace: 'nowrap',
};

const rowStyle: CSSProperties = {
  cursor: 'pointer',
};

const emptyStyle: CSSProperties = {
  margin: '8px 0 0',
};

const errorStyle: CSSProperties = {
  color: 'var(--color-error)',
  margin: '8px 0 0',
};

const detailLoadingStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '160px',
};

const skeletonHashBarStyle: CSSProperties = {
  display: 'inline-block',
  width: '1em',
};

const skeletonProjectBarStyle: CSSProperties = {
  display: 'block',
  width: '70%',
};

const skeletonYearBarStyle: CSSProperties = {
  display: 'inline-block',
  width: '3em',
};

const skeletonCompanyBarStyle: CSSProperties = {
  display: 'inline-block',
  width: '4.5em',
};

export function PortfolioContent() {
  const [status, setStatus] = useState<PortfolioStatus>('loading');
  const [posts, setPosts] = useState<GhostPost[]>([]);
  const [view, setView] = useState<PortfolioView>('list');
  const [selectedProject, setSelectedProject] = useState<GhostPost | null>(
    null,
  );
  const [detailStatus, setDetailStatus] = useState<PortfolioStatus>('loading');
  const [detailPost, setDetailPost] = useState<GhostPost | null>(null);

  useEffect(() => {
    let cancelled = false;

    getPostsByTag(PORTFOLIO_TAG, PORTFOLIO_POST_LIMIT, undefined, true)
      .then((result) => {
        if (cancelled) return;
        setPosts(result);
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedProject) return;

    let cancelled = false;

    getPostBySlug(selectedProject.slug)
      .then((result) => {
        if (cancelled) return;
        setDetailPost(result);
        setDetailStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setDetailStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProject]);

  function openProject(post: GhostPost) {
    if (post.slug !== selectedProject?.slug) {
      setDetailStatus('loading');
      setDetailPost(null);
    }
    setSelectedProject(post);
    setView('detail');
  }

  function backToList() {
    setView('list');
  }

  if (view === 'detail') {
    return (
      <div style={wrapperStyle}>
        <PanelHeader
          nodeId={PORTFOLIO_CONTENT.backLinkWord}
          onLabelClick={backToList}
          detail={
            selectedProject
              ? `${selectedProject.title} (${getProjectYear(selectedProject)})`
              : undefined
          }
        />

        {detailStatus === 'loading' && (
          <div style={detailLoadingStyle}>
            <span
              className='articles-spinner'
              role='status'
              aria-label={PORTFOLIO_CONTENT.detailLoadingMessage}
            />
          </div>
        )}

        {detailStatus === 'success' && detailPost && (
          <article>
            <div
              className='article-body'
              dangerouslySetInnerHTML={{ __html: detailPost.html ?? '' }}
            />
          </article>
        )}

        {detailStatus === 'error' && (
          <p style={errorStyle}>{PORTFOLIO_CONTENT.detailErrorMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <PanelHeader nodeId={PORTFOLIO_CONTENT.backLinkWord} />

      <div style={wrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, ...headerCellDividerStyle }}>
                {PORTFOLIO_CONTENT.columnHash}
              </th>
              <th style={{ ...headerCellStyle, ...headerCellDividerStyle }}>
                {PORTFOLIO_CONTENT.columnProject}
              </th>
              <th style={{ ...headerCellStyle, ...headerCellDividerStyle }}>
                {PORTFOLIO_CONTENT.columnYear}
              </th>
              <th style={headerCellStyle}>{PORTFOLIO_CONTENT.columnCompany}</th>
            </tr>
          </thead>

          {status === 'loading' && (
            <tbody>
              {Array.from({ length: PORTFOLIO_SKELETON_ROW_COUNT }).map(
                (_, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        ...cellStyle,
                        ...cellDividerStyle,
                        ...hashCellStyle,
                      }}
                    >
                      <span
                        className='articles-skeleton-bar'
                        style={skeletonHashBarStyle}
                      />
                    </td>
                    <td style={{ ...cellStyle, ...cellDividerStyle }}>
                      <span
                        className='articles-skeleton-bar'
                        style={skeletonProjectBarStyle}
                      />
                    </td>
                    <td style={{ ...cellStyle, ...cellDividerStyle }}>
                      <span
                        className='articles-skeleton-bar'
                        style={skeletonYearBarStyle}
                      />
                    </td>
                    <td style={cellStyle}>
                      <span
                        className='articles-skeleton-bar'
                        style={skeletonCompanyBarStyle}
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          )}

          {status === 'success' && posts.length > 0 && (
            <tbody>
              {posts.map((post, index) => (
                <tr
                  key={post.id}
                  className='articles-row'
                  style={rowStyle}
                  onClick={() => openProject(post)}
                >
                  <td
                    style={{
                      ...cellStyle,
                      ...cellDividerStyle,
                      ...hashCellStyle,
                    }}
                  >
                    {index + 1}
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      ...projectCellStyle,
                      ...cellDividerStyle,
                    }}
                  >
                    <button
                      type='button'
                      style={projectButtonStyle}
                      onClick={() => openProject(post)}
                    >
                      {post.title}
                    </button>
                  </td>
                  <td style={{ ...cellStyle, ...cellDividerStyle }}>
                    {getProjectYear(post)}
                  </td>
                  <td style={{ ...cellStyle, ...companyCellStyle }}>{getProjectCompany(post)}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>

        {status === 'success' && posts.length === 0 && (
          <p style={emptyStyle}>{PORTFOLIO_CONTENT.emptyMessage}</p>
        )}

        {status === 'error' && (
          <p style={errorStyle}>{PORTFOLIO_CONTENT.errorMessage}</p>
        )}
      </div>
    </div>
  );
}

import type { CSSProperties } from 'react'

interface PanelHeaderProps {
  nodeId: string
  detail?: string
  onLabelClick?: () => void // if provided, nodeId renders as a clickable "back" button
}

const containerStyle: CSSProperties = {
  margin: '0 0 12px',
  color: 'var(--color-accent)',
  fontSize: '14px',
}

const prefixStyle: CSSProperties = {
  fontWeight: 400,
}

const labelStyle: CSSProperties = {
  fontWeight: 400,
}

export function PanelHeader({ nodeId, detail, onLabelClick }: PanelHeaderProps) {
  return (
    <h1 style={containerStyle}>
      <span style={prefixStyle}>{'> '}</span>
      {onLabelClick ? (
        <button
          type="button"
          className="panel-header-back-link"
          style={labelStyle}
          onClick={onLabelClick}
        >
          {nodeId}
        </button>
      ) : (
        <span style={labelStyle}>{nodeId}</span>
      )}
      {detail && <span style={labelStyle}>{' / '}{detail}</span>}
    </h1>
  )
}

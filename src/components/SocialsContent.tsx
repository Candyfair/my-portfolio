import type { CSSProperties } from 'react'
import { SOCIALS_CONTENT } from '../data/socialsContent'
import { PanelHeader } from './PanelHeader'

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const labelStyle: CSSProperties = {
  fontWeight: 700,
  marginRight: '8px',
}

export function SocialsContent() {
  return (
    <div>
      <PanelHeader nodeId="socials" />

      <ul style={listStyle}>
        {SOCIALS_CONTENT.map((link) => (
          <li key={link.label}>
            <span style={labelStyle}>{link.label}</span>
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {link.displayUrl}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

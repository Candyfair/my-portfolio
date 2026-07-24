import type { CSSProperties } from 'react'
import { SOCIALS_CONTENT } from '../data/socialsContent'
import { useIsMobile } from '../hooks/useIsMobile'
import { PanelHeader } from './PanelHeader'

// Fixed enough to fit the longest label ("Instagram") so every row's url starts at the same x.
const SOCIALS_LABEL_WIDTH_PX = 90

const listStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

// li stays the flex container so the global li::before dash lands before the row, not above it.
const itemStyle: CSSProperties = {
  display: 'flex',
  gap: '4px',
}

const rowStyleDesktop: CSSProperties = {
  display: 'flex',
  gap: '8px',
}

const rowStyleMobile: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
}

const labelStyleDesktop: CSSProperties = {
  fontWeight: 700,
  flex: `0 0 ${SOCIALS_LABEL_WIDTH_PX}px`,
}

const labelStyleMobile: CSSProperties = {
  fontWeight: 700,
}

export function SocialsContent() {
  const isMobile = useIsMobile()

  return (
    <div>
      <PanelHeader nodeId="socials" />

      <ul style={listStyle}>
        {SOCIALS_CONTENT.map((link) => (
          <li key={link.label} style={itemStyle}>
            <div style={isMobile ? rowStyleMobile : rowStyleDesktop}>
              <span style={isMobile ? labelStyleMobile : labelStyleDesktop}>{link.label}</span>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.displayUrl}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSelection } from '../context/SelectionContext'
import { useIsMobile } from '../hooks/useIsMobile'

const CARDS = [
  { key: 'languages', title: 'Languages',              w: 170, dx: -155, dy: -106, items: ['French (native)', 'English (bilingual C2)'] },
  { key: 'databases', title: 'Databases',              w: 145, dx:  125, dy: -100, items: ['SQL', 'PostgreSQL'] },
  { key: 'testing',   title: 'Testing',                w: 155, dx:   42, dy:  -40, items: ['Jest', 'Vitest', 'React Testing Library'] },
  { key: 'ui',        title: 'UI Design',              w: 170, dx: -165, dy:   28, items: ['Figma', 'Photoshop', 'Illustrator', 'InDesign'] },
  { key: 'stack',     title: 'Languages & Frameworks', w: 230, dx:   20, dy:   40, items: ['JavaScript (ES6+)', 'TypeScript', 'HTML5', 'CSS3', 'React', 'React Native', 'Redux', 'RTK Query', 'react-hook-form', 'Node.js', 'TailwindCSS', 'SASS', 'CSS Modules'] },
  { key: 'dataviz',   title: 'Data Visualization',     w: 195, dx: -210, dy:  117, items: ['D3.js (force simulations, custom SVG/HTML rendering)', 'Recharts', 'VictoryChart'] },
  { key: 'ai',        title: 'AI / LLM',               w: 230, dx:  40, dy:  178, items: ['Local LLM integration (Ollama)', 'SSE streaming', 'anti-hallucination pipelines', 'multilingual few-shot prompting'] },
  { key: 'tools',     title: 'Tools & Environment',    w: 170, dx: -240, dy:  238, items: ['Vite', 'Expo', 'Git', 'GitHub', 'Vercel', 'VSCode', 'agentic tool-assisted development (Claude Code)'] },
  { key: 'methods',   title: 'Methods',                w: 195, dx:  -40, dy:  305, items: ['Agile (Scrum/Kanban)', 'code review', 'technical documentation', 'requirements specification'] },
] as const

interface SkillsOverlayProps {
  onCardsBottomChange: (bottom: number) => void
}

export function SkillsOverlay({ onCardsBottomChange }: SkillsOverlayProps) {
  const { selectedId, selectedScreenPos } = useSelection()
  const isMobile = useIsMobile()
  // On mobile, skills content is a vertical stack in ContentPanel — no floating overlay
  const isOpen = selectedId === 'skills' && selectedScreenPos !== null && !isMobile
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!isOpen) {
      onCardsBottomChange(0)
      return
    }
    // Cards are in the DOM immediately after render (animation is visual-only).
    // Measure on the next paint so getBoundingClientRect() reflects layout.
    const raf = requestAnimationFrame(() => {
      const bottom = cardRefs.current.reduce((max, el) => {
        if (!el) return max
        return Math.max(max, el.getBoundingClientRect().bottom)
      }, 0)
      onCardsBottomChange(bottom)
    })
    return () => cancelAnimationFrame(raf)
  }, [isOpen, onCardsBottomChange])

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 8 }}>
          {CARDS.map((card, i) => (
            <motion.div
              key={card.key}
              ref={el => { cardRefs.current[i] = el }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeIn', delay: i * 0.06 }}
              style={{
                position: 'absolute',
                left: selectedScreenPos!.x + card.dx,
                top: selectedScreenPos!.y + card.dy,
                width: card.w,
                fontFamily: 'inherit',
                fontSize: '11px',
                color: 'var(--color-fg)',
                background: 'var(--articles-table-bg)',
                border: '1px solid var(--newsfeed-legend)',
                borderRadius: '12px',
                padding: '6px 10px',
                pointerEvents: 'auto',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{card.title}</div>
              <div>{card.items.join(', ')}</div>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

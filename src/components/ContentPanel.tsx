import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useSelection } from '../context/SelectionContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { DOT_PX, SKILLS_ENLARGED_DOT_PX } from './PortfolioGraph'

// navBottom now tracks the nav+graph container bottom (see App.tsx navRef), so no extra gap needed
const NAV_GAP_PX = 0

const RISING_NODES = new Set(['about', 'portfolio', 'articles'])
const ARTICLES_RISE_MARGIN_PX = 50
const NAV_LIST_MARGIN_PX = 20
// Minimum gap between the bottom edge of the selected node and the top of the panel (mobile rise cap)
const PANEL_NODE_CLEARANCE_PX = 20
// Skills node grows to SKILLS_ENLARGED_DOT_PX on selection (see PortfolioGraph.tsx
// DotNode animate block) — this is the effective screen radius used
// for its mobile rise cap.
const SKILLS_NODE_RADIUS_PX = SKILLS_ENLARGED_DOT_PX / 2
// Extra clearance below the enlarged skills node before the panel
// starts, calibrated against MOBILE__Skills.png mockup (~75px total
// gap from node center minus SKILLS_NODE_RADIUS_PX)
const SKILLS_MOBILE_NODE_CLEARANCE_PX = 75

// Mobile skills: vertical card stack matching MOBILE - Skills.png order
const SKILLS_MOBILE_CARDS = [
  { key: 'stack',     title: 'Languages & Frameworks', items: ['JavaScript (ES6+)', 'TypeScript', 'HTML5', 'CSS3', 'React', 'React Native', 'Redux', 'RTK Query', 'react-hook-form', 'Node.js', 'TailwindCSS', 'SASS', 'CSS Modules'] },
  { key: 'dataviz',   title: 'Data Visualization',     items: ['D3.js (force simulations, custom SVG/HTML rendering)', 'Recharts', 'VictoryChart'] },
  { key: 'ai',        title: 'AI / LLM',               items: ['Local LLM integration (Ollama)', 'SSE streaming', 'anti-hallucination pipelines', 'multilingual few-shot prompting'] },
  { key: 'testing',   title: 'Testing',                items: ['Jest', 'Vitest', 'React Testing Library'] },
  { key: 'databases', title: 'Databases',              items: ['SQL', 'PostgreSQL'] },
  { key: 'ui',        title: 'UI Design',              items: ['Figma', 'Photoshop', 'Illustrator', 'InDesign'] },
  { key: 'tools',     title: 'Tools & Environment',    items: ['Vite', 'Expo', 'Git', 'GitHub', 'Vercel', 'VSCode', 'agentic tool-assisted development (Claude Code)'] },
  { key: 'methods',   title: 'Methods',                items: ['Agile (Scrum/Kanban)', 'code review', 'technical documentation', 'requirements specification'] },
  { key: 'languages', title: 'Languages',              items: ['French (native)', 'English (bilingual C2)'] },
] as const

function SkillsMobileStack() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {SKILLS_MOBILE_CARDS.map(card => (
        <div
          key={card.key}
          style={{
            border: '1px solid var(--color-fg)',
            padding: '6px 10px',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{card.title}</div>
          <div>{card.items.join(', ')}</div>
        </div>
      ))}
    </div>
  )
}

interface ContentPanelProps {
  separatorBottom: number
  navBottom: number
  navListBottom: number
}

const PLACEHOLDER: Record<string, ReactNode> = {
  about: (
    <>
      <p>Maecenas quis velit vitae ipsum rhoncus iaculis. Duis ac mattis nulla. In iaculis ante vel odio dignissim mattis. Donec facilisis vitae ante sed auctor. Ut non nisl et nibh facilisis blandit eu quis justo. Etiam nec elit accumsan, dapibus mi ut, facilisis nisl. Vivamus et purus pulvinar, volutpat justo sit amet, ultricies erat. Curabitur egestas venenatis ipsum et porttitor. Vivamus vitae lacinia ligula. In posuere metus massa, in dignissim magna viverra pharetra. Nulla a orci feugiat, placerat turpis non, commodo mi. Donec a rhoncus metus, ac molestie quam.</p>

      <p>Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Duis interdum porttitor urna, tincidunt malesuada sem consectetur faucibus. Donec tellus sem, ultricies at nisl a, egestas mollis ante. Etiam eros quam, vehicula sed tempor vel, egestas faucibus orci. Nam ultrices volutpat dui vel aliquam. Donec id posuere dolor. Vestibulum quis cursus turpis. Duis et malesuada massa. Donec in tortor consectetur, blandit metus id, feugiat dolor. Pellentesque sed urna varius, consequat justo non, blandit neque. Nam dignissim sagittis nisi, at scelerisque ante semper eu.</p>

      <p>Cras pellentesque nisl volutpat, sollicitudin purus in, pretium tellus. Pellentesque sagittis non arcu eu pulvinar. Aliquam sit amet ultrices tortor. Nulla facilisi. Mauris ac aliquam ipsum, sit amet pretium tortor. Donec id condimentum purus, eget facilisis mauris. Ut nulla mauris, consequat ultricies sollicitudin vitae, accumsan ut metus. Curabitur volutpat id odio ac iaculis. Duis tellus mi, dictum eu nisl ut, accumsan venenatis urna.</p>

      <p>Vestibulum ac massa et magna venenatis placerat. Donec nec magna eu ex sagittis varius ac et nisi. Aenean commodo elementum ipsum quis dignissim. Aenean porta quis neque quis tincidunt. Phasellus congue efficitur enim, eget tincidunt leo mollis vitae. Maecenas nec tincidunt felis. Fusce sagittis neque tincidunt accumsan vestibulum. Vivamus justo libero, rhoncus nec erat ut, blandit dignissim nunc.</p>

      <p>Suspendisse condimentum hendrerit efficitur. Sed dictum porta elit, vitae rhoncus metus egestas eu. Nam vel finibus orci, sit amet aliquam ex. Morbi accumsan erat eu orci ornare, eget sagittis ante faucibus. In tempus tellus pharetra eros volutpat, id venenatis ipsum vestibulum. Pellentesque orci sapien, elementum eget lorem quis, tristique lacinia turpis. Integer finibus erat eu purus gravida, sit amet cursus sem hendrerit. Mauris imperdiet mattis posuere. Aliquam in tellus in elit interdum tempus. Donec nec lectus ultricies felis dignissim varius vitae in ligula. Duis euismod vulputate ligula a malesuada.</p>
    </>
  ),
  portfolio: (
    <>
      <p>Maecenas quis velit vitae ipsum rhoncus iaculis. Duis ac mattis nulla. In iaculis ante vel odio dignissim mattis. Donec facilisis vitae ante sed auctor. Ut non nisl et nibh facilisis blandit eu quis justo. Etiam nec elit accumsan, dapibus mi ut, facilisis nisl. Vivamus et purus pulvinar, volutpat justo sit amet, ultricies erat. Curabitur egestas venenatis ipsum et porttitor. Vivamus vitae lacinia ligula. In posuere metus massa, in dignissim magna viverra pharetra. Nulla a orci feugiat, placerat turpis non, commodo mi. Donec a rhoncus metus, ac molestie quam.</p>

      <p>Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Duis interdum porttitor urna, tincidunt malesuada sem consectetur faucibus. Donec tellus sem, ultricies at nisl a, egestas mollis ante. Etiam eros quam, vehicula sed tempor vel, egestas faucibus orci. Nam ultrices volutpat dui vel aliquam. Donec id posuere dolor. Vestibulum quis cursus turpis. Duis et malesuada massa. Donec in tortor consectetur, blandit metus id, feugiat dolor. Pellentesque sed urna varius, consequat justo non, blandit neque. Nam dignissim sagittis nisi, at scelerisque ante semper eu.</p>

      <p>Cras pellentesque nisl volutpat, sollicitudin purus in, pretium tellus. Pellentesque sagittis non arcu eu pulvinar. Aliquam sit amet ultrices tortor. Nulla facilisi. Mauris ac aliquam ipsum, sit amet pretium tortor. Donec id condimentum purus, eget facilisis mauris. Ut nulla mauris, consequat ultricies sollicitudin vitae, accumsan ut metus. Curabitur volutpat id odio ac iaculis. Duis tellus mi, dictum eu nisl ut, accumsan venenatis urna.</p>

      <p>Vestibulum ac massa et magna venenatis placerat. Donec nec magna eu ex sagittis varius ac et nisi. Aenean commodo elementum ipsum quis dignissim. Aenean porta quis neque quis tincidunt. Phasellus congue efficitur enim, eget tincidunt leo mollis vitae. Maecenas nec tincidunt felis. Fusce sagittis neque tincidunt accumsan vestibulum. Vivamus justo libero, rhoncus nec erat ut, blandit dignissim nunc.</p>

      <p>Suspendisse condimentum hendrerit efficitur. Sed dictum porta elit, vitae rhoncus metus egestas eu. Nam vel finibus orci, sit amet aliquam ex. Morbi accumsan erat eu orci ornare, eget sagittis ante faucibus. In tempus tellus pharetra eros volutpat, id venenatis ipsum vestibulum. Pellentesque orci sapien, elementum eget lorem quis, tristique lacinia turpis. Integer finibus erat eu purus gravida, sit amet cursus sem hendrerit. Mauris imperdiet mattis posuere. Aliquam in tellus in elit interdum tempus. Donec nec lectus ultricies felis dignissim varius vitae in ligula. Duis euismod vulputate ligula a malesuada.</p>
    </>
  ),
  skills:    <p>Placeholder — skills overlay (M4).</p>,
  articles:  (
        <>
      <p>Maecenas quis velit vitae ipsum rhoncus iaculis. Duis ac mattis nulla. In iaculis ante vel odio dignissim mattis. Donec facilisis vitae ante sed auctor. Ut non nisl et nibh facilisis blandit eu quis justo. Etiam nec elit accumsan, dapibus mi ut, facilisis nisl. Vivamus et purus pulvinar, volutpat justo sit amet, ultricies erat. Curabitur egestas venenatis ipsum et porttitor. Vivamus vitae lacinia ligula. In posuere metus massa, in dignissim magna viverra pharetra. Nulla a orci feugiat, placerat turpis non, commodo mi. Donec a rhoncus metus, ac molestie quam.</p>

      <p>Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Duis interdum porttitor urna, tincidunt malesuada sem consectetur faucibus. Donec tellus sem, ultricies at nisl a, egestas mollis ante. Etiam eros quam, vehicula sed tempor vel, egestas faucibus orci. Nam ultrices volutpat dui vel aliquam. Donec id posuere dolor. Vestibulum quis cursus turpis. Duis et malesuada massa. Donec in tortor consectetur, blandit metus id, feugiat dolor. Pellentesque sed urna varius, consequat justo non, blandit neque. Nam dignissim sagittis nisi, at scelerisque ante semper eu.</p>

      <p>Cras pellentesque nisl volutpat, sollicitudin purus in, pretium tellus. Pellentesque sagittis non arcu eu pulvinar. Aliquam sit amet ultrices tortor. Nulla facilisi. Mauris ac aliquam ipsum, sit amet pretium tortor. Donec id condimentum purus, eget facilisis mauris. Ut nulla mauris, consequat ultricies sollicitudin vitae, accumsan ut metus. Curabitur volutpat id odio ac iaculis. Duis tellus mi, dictum eu nisl ut, accumsan venenatis urna.</p>

      <p>Vestibulum ac massa et magna venenatis placerat. Donec nec magna eu ex sagittis varius ac et nisi. Aenean commodo elementum ipsum quis dignissim. Aenean porta quis neque quis tincidunt. Phasellus congue efficitur enim, eget tincidunt leo mollis vitae. Maecenas nec tincidunt felis. Fusce sagittis neque tincidunt accumsan vestibulum. Vivamus justo libero, rhoncus nec erat ut, blandit dignissim nunc.</p>

      <p>Suspendisse condimentum hendrerit efficitur. Sed dictum porta elit, vitae rhoncus metus egestas eu. Nam vel finibus orci, sit amet aliquam ex. Morbi accumsan erat eu orci ornare, eget sagittis ante faucibus. In tempus tellus pharetra eros volutpat, id venenatis ipsum vestibulum. Pellentesque orci sapien, elementum eget lorem quis, tristique lacinia turpis. Integer finibus erat eu purus gravida, sit amet cursus sem hendrerit. Mauris imperdiet mattis posuere. Aliquam in tellus in elit interdum tempus. Donec nec lectus ultricies felis dignissim varius vitae in ligula. Duis euismod vulputate ligula a malesuada.</p>
    </>
  ),
  newsfeed:  <p>Placeholder — newsfeed log.</p>,
  contact:   <p>Placeholder — contact form.</p>,
  socials:   <p>Placeholder — links.</p>,
}

export function ContentPanel({ separatorBottom, navBottom, navListBottom }: ContentPanelProps) {
  const { selectedId, selectedScreenPos, articlesAnchorScreenPosRef } = useSelection()
  const isMobile = useIsMobile()
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    setContentHeight(0)
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setContentHeight(el.offsetHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [selectedId])

  const windowH = window.innerHeight

  // Rise cap (regime 3 floor): minimum panelTop value.
  // Mobile general (not skills): bottom edge of the selected node (screen Y at selection time
  //   + DOT_PX / 2) plus PANEL_NODE_CLEARANCE_PX, but never below separatorBottom (panel can
  //   only rise, never push past natural position).
  // Mobile skills: same node-relative pattern as the general mobile case, but using the
  //   enlarged (DOT_PX * 3) node radius plus SKILLS_MOBILE_NODE_CLEARANCE_PX, since the
  //   node visually grows by 3x on selection (see PortfolioGraph.tsx DotNode).
  // Desktop about/portfolio/articles (medium content): capped 50px below articles anchor.
  // Desktop about/portfolio/articles (very long content) + all other desktop nodes: navBottom.
  const desiredRaw = windowH - contentHeight
  const articlesAnchorY = articlesAnchorScreenPosRef.current?.y ?? navBottom
  const articlesRiseCap = articlesAnchorY + ARTICLES_RISE_MARGIN_PX

  const riseCap = (() => {
    if (isMobile && selectedId === 'skills' && selectedScreenPos !== null)
      return Math.min(
        selectedScreenPos.y + SKILLS_NODE_RADIUS_PX + SKILLS_MOBILE_NODE_CLEARANCE_PX,
        separatorBottom
      )
    if (isMobile && selectedId !== 'skills' && selectedScreenPos !== null)
      return Math.min(selectedScreenPos.y + DOT_PX / 2 + PANEL_NODE_CLEARANCE_PX, separatorBottom)
    if (RISING_NODES.has(selectedId ?? '')) {
      if (desiredRaw >= articlesRiseCap) return articlesRiseCap
      return navListBottom + NAV_LIST_MARGIN_PX
    }
    return navBottom + NAV_GAP_PX
  })()

  const panelTop = contentHeight > 0
    ? Math.max(riseCap, Math.min(separatorBottom, desiredRaw))
    : separatorBottom

  return (
    <AnimatePresence>
      {selectedId && (
        <motion.div
          key={selectedId}
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            top: panelTop,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(520px, 100vw)',
            background: 'var(--color-bg)',
            zIndex: 5,
            borderTop: '1px dashed var(--color-fg)',
            maxHeight: windowH - panelTop,
            overflowY: 'auto',
          }}
        >
          <div
            ref={contentRef}
            style={{
              padding: isMobile ? '1rem 12px 1.5rem' : '1rem 0 1.5rem',
              fontSize: isMobile ? '14px' : '11px',
            }}
          >
            {isMobile && selectedId === 'skills' ? <SkillsMobileStack /> : PLACEHOLDER[selectedId]}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

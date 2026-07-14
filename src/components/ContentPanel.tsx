import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useSelection } from '../context/SelectionContext'

const NAV_GAP_PX = 120

interface ContentPanelProps {
  separatorBottom: number
  navBottom: number
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
      <p>
        <strong>Medical Device Mobile App</strong><br />
        React Native / TypeScript mobile application certified as a medical device, deployed on
        both the App Store and Google Play. Built for a healthcare platform supporting complex
        clinical workflows, offline-first data sync, and REST API integration. Responsible for
        feature development, architecture, code review, and production maintenance in a regulated
        environment. Collaborated with regulatory, QA, and product teams to meet certification
        requirements throughout the full release cycle.
      </p>
      <p>
        <strong>Grammar Learning App</strong><br />
        Anti-hallucination pipeline for a language acquisition application powered by local LLMs
        (Ollama). The core challenge was preventing hallucination of grammar rules for a minority
        language with limited training data. Implemented prompt design techniques, sampling
        controls, and real-time token streaming via Server-Sent Events. Next.js frontend with live
        response streaming and a structured feedback interface.
      </p>
      <p>
        <strong>Newsletter Summarisation Pipeline</strong><br />
        Automated pipeline that ingests newsletters from multiple sources, runs summarisation via
        a local LLM, and delivers a structured daily digest. Designed to reduce information
        overload while staying current with technical content. Built with Python, Ollama, and
        scheduled processing.
      </p>
      <p>
        <strong>Renewable Energy D3.js Dashboard</strong><br />
        Interactive data visualisation dashboard for monitoring renewable energy asset performance.
        Built with D3.js and React, featuring real-time data updates, multiple chart types, and an
        asset comparison view. Designed to support operational decision-making for an energy
        operator.
      </p>
    </>
  ),
  skills:    <p>Placeholder — skills overlay (M4).</p>,
  articles:  <p>Placeholder — articles table.</p>,
  newsfeed:  <p>Placeholder — newsfeed log.</p>,
  contact:   <p>Placeholder — contact form.</p>,
  socials:   <p>Placeholder — links.</p>,
}

export function ContentPanel({ separatorBottom, navBottom }: ContentPanelProps) {
  const { selectedId } = useSelection()
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
  // clamp: prefer natural position (below separator), pull up if content doesn't fit,
  // but never above the nav list
  const panelTop = contentHeight > 0
    ? Math.max(navBottom + NAV_GAP_PX, Math.min(separatorBottom, windowH - contentHeight))
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
              padding: '1rem 0 1.5rem',
              fontSize: '11px',
            }}
          >
            {PLACEHOLDER[selectedId]}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

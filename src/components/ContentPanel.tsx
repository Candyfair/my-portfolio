import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSelection } from '../context/SelectionContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { AboutContent } from './AboutContent';
import { ArticlesContent } from './ArticlesContent';
import { ContactForm } from './ContactForm';
import { NewsfeedContent } from './NewsfeedContent';
import { PortfolioContent } from './PortfolioContent';
import { SocialsContent } from './SocialsContent';
import { SkillsMobileStack } from './SkillsMobileStack';
import { DOT_PX, SKILLS_ENLARGED_DOT_PX } from './PortfolioGraph';

// navBottom now tracks the nav+graph container bottom (see App.tsx navRef), so no extra gap needed
const NAV_GAP_PX = 0;

const RISING_NODES = new Set(['about', 'portfolio', 'articles']);
const ARTICLES_RISE_MARGIN_PX = 50;
const NAV_LIST_MARGIN_PX = 20;
// Minimum gap between the bottom edge of the selected node and the top of the panel (mobile rise cap)
const PANEL_NODE_CLEARANCE_PX = 20;
// Skills node grows to SKILLS_ENLARGED_DOT_PX on selection (see PortfolioGraph.tsx
// DotNode animate block) — this is the effective screen radius used
// for its mobile rise cap.
const SKILLS_NODE_RADIUS_PX = SKILLS_ENLARGED_DOT_PX / 2;
// Extra clearance below the enlarged skills node before the panel
// starts, calibrated against MOBILE__Skills.png mockup (~75px total
// gap from node center minus SKILLS_NODE_RADIUS_PX)
const SKILLS_MOBILE_NODE_CLEARANCE_PX = 75;

const NEWSFEED_MOBILE_NODE_CLEARANCE_PX = -40; // initial estimate, needs manual calibration
const SOCIALS_MOBILE_NODE_CLEARANCE_PX = -70; // initial estimate, needs manual calibration

interface ContentPanelProps {
  separatorBottom: number;
  navBottom: number;
  navListBottom: number;
}

const PLACEHOLDER: Record<string, ReactNode> = {
  about: <AboutContent />,
  portfolio: <PortfolioContent />,
  skills: <p></p>,
  articles: <ArticlesContent />,
  newsfeed: <NewsfeedContent />,
  contact: <ContactForm />,
  socials: <SocialsContent />,
};

export function ContentPanel({
  separatorBottom,
  navBottom,
  navListBottom,
}: ContentPanelProps) {
  const {
    selectedId,
    selectedScreenPos,
    articlesAnchorScreenPosRef,
    isArticleDetailOpen,
  } = useSelection();
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    setContentHeight(0);
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContentHeight(el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedId]);

  const windowH = window.innerHeight;

  // Rise cap (regime 3 floor): minimum panelTop value.
  // Mobile general (not skills): bottom edge of the selected node (screen Y at selection time
  //   + DOT_PX / 2) plus PANEL_NODE_CLEARANCE_PX, but never below separatorBottom (panel can
  //   only rise, never push past natural position).
  // Mobile skills: same node-relative pattern as the general mobile case, but using the
  //   enlarged (DOT_PX * 3) node radius plus SKILLS_MOBILE_NODE_CLEARANCE_PX, since the
  //   node visually grows by 3x on selection (see PortfolioGraph.tsx DotNode).
  // Desktop about/portfolio/articles (medium content): capped 50px below articles anchor.
  // Desktop about/portfolio/articles (very long content) + all other desktop nodes: navBottom.
  const desiredRaw = windowH - contentHeight;
  const articlesAnchorY = articlesAnchorScreenPosRef.current?.y ?? navBottom;
  const articlesRiseCap = articlesAnchorY + ARTICLES_RISE_MARGIN_PX;

  const riseCap = (() => {
    if (isMobile && selectedId === 'skills' && selectedScreenPos !== null)
      return Math.min(
        selectedScreenPos.y +
          SKILLS_NODE_RADIUS_PX +
          SKILLS_MOBILE_NODE_CLEARANCE_PX,
        separatorBottom,
      );
    // Mobile articles: decouple the rise cap from the node's own graph position, which can
    // sit low in the force-directed layout. Anchor to navListBottom instead, same as the
    // desktop "long content" case further below — the selected node may end up visually
    // covered by the panel, but the "> articles / title" header stays reachable above the content.
    if (isMobile && selectedId === 'articles' && isArticleDetailOpen)
      return Math.min(navListBottom + NAV_LIST_MARGIN_PX, separatorBottom);
    if (isMobile && selectedId === 'newsfeed' && selectedScreenPos !== null)
      return Math.min(
        selectedScreenPos.y + DOT_PX / 2 + NEWSFEED_MOBILE_NODE_CLEARANCE_PX,
        separatorBottom,
      );
    if (isMobile && selectedId === 'socials' && selectedScreenPos !== null)
      return Math.min(
        selectedScreenPos.y + DOT_PX / 2 + SOCIALS_MOBILE_NODE_CLEARANCE_PX,
        separatorBottom,
      );
    if (isMobile && selectedId !== 'skills' && selectedScreenPos !== null)
      return Math.min(
        selectedScreenPos.y + DOT_PX / 2 + PANEL_NODE_CLEARANCE_PX,
        separatorBottom,
      );
    if (RISING_NODES.has(selectedId ?? '')) {
      if (desiredRaw >= articlesRiseCap) return articlesRiseCap;
      return navListBottom + NAV_LIST_MARGIN_PX;
    }
    return navBottom + NAV_GAP_PX;
  })();

  const panelTop =
    isMobile && selectedId === 'socials' && selectedScreenPos !== null
      ? riseCap
      : contentHeight > 0
        ? Math.max(riseCap, Math.min(separatorBottom, desiredRaw))
        : separatorBottom;

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
            width: 'min(530px, 100vw)',
            background: 'var(--color-bg)',
            zIndex: 15,
            borderTop: '1px dashed var(--color-fg)',
            maxHeight: windowH - panelTop,
            overflowY: 'auto',
          }}
        >
          <div
            ref={contentRef}
            style={{
              padding: isMobile ? '1rem 12px 1.5rem' : '1rem 0 1.5rem',
            }}
          >
            {isMobile && selectedId === 'skills' ? (
              <SkillsMobileStack />
            ) : (
              PLACEHOLDER[selectedId]
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

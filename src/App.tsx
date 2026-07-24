import './App.css';
import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  PortfolioGraph,
  SKILLS_ENLARGED_DOT_PX,
} from './components/PortfolioGraph';
import { ContentPanel } from './components/ContentPanel';
import { SkillsOverlay } from './components/SkillsOverlay';
import { useSelection } from './context/SelectionContext';
import { useIsMobile } from './hooks/useIsMobile';

const NAV_ITEMS = [
  'about',
  'portfolio',
  'skills',
  'articles',
  'newsfeed',
  'contact',
  'socials',
] as const;

const SKILLS_OVERLAY_BOTTOM_MARGIN = 20; // px gap between lowest skills card and the dashed separator

// Flying label offset for the skills node only — isolated from the general +14/-6 offset
// (calibrated for the base DOT_PX radius) because skills renders at SKILLS_ENLARGED_DOT_PX
// once selected. Same derivation as the general offset: radius + 8px breathing margin
// horizontally, -radius vertically.
const SKILLS_LABEL_OFFSET_X_PX = SKILLS_ENLARGED_DOT_PX / 2 + 8;
const SKILLS_LABEL_OFFSET_Y_PX = -(SKILLS_ENLARGED_DOT_PX / 2);
const SKILLS_LABEL_DESKTOP_OFFSET_X_PX = SKILLS_ENLARGED_DOT_PX / 2 + 8;
const SKILLS_LABEL_DESKTOP_OFFSET_Y_PX = -7; // initial estimate, needs manual calibration

// Flying label offset for the portfolio node on mobile only — isolated from the general
// +14/-6 offset because the portfolio node sits near the right edge of the mobile graph,
// so growing the label rightward (the general formula) pushes it off-screen. Anchored to
// the node's left instead (see translateX(-100%) below), regardless of the node's own size.
const PORTFOLIO_LABEL_OFFSET_X_PX = 14;
const PORTFOLIO_LABEL_OFFSET_Y_PX = 16;

function App() {
  const { selectedId, selectedScreenPos, select, deselect } = useSelection();
  const isMobile = useIsMobile();

  const separatorRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const navListRef = useRef<HTMLElement>(null);
  const [separatorBottom, setSeparatorBottom] = useState(0);
  const [navBottom, setNavBottom] = useState(0);
  const [navListBottom, setNavListBottom] = useState(0);
  const [skillsCardsBottom, setSkillsCardsBottom] = useState(0);
  // Skills-specific separator: sits below the lowest card. Isolated — never shared with general panel.
  const skillsSeparatorBottom = Math.max(
    separatorBottom,
    skillsCardsBottom + SKILLS_OVERLAY_BOTTOM_MARGIN,
  );

  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    if (inputError) setInputError('');
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const match = NAV_ITEMS.find(
      (item) => item === inputValue.trim().toLowerCase(),
    );
    if (match) {
      select(match);
      setInputValue('');
      setInputError('');
    } else {
      setInputValue('');
      setInputError('node not found');
    }
  }

  useLayoutEffect(() => {
    function measure() {
      if (separatorRef.current) {
        setSeparatorBottom(separatorRef.current.getBoundingClientRect().bottom);
      }
      if (navRef.current) {
        setNavBottom(navRef.current.getBoundingClientRect().bottom);
      }
      if (navListRef.current) {
        setNavListBottom(navListRef.current.getBoundingClientRect().bottom);
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <LayoutGroup>
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '1.5rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '530px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Where do you want to go? */}
          <div style={{ marginBottom: '0.75rem' }}>
            <p style={{ margin: '0 0 4px' }}>Where do you want to go?</p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid var(--color-fg)',
                padding: '3px 8px',
              }}
            >
              <span style={{ fontSize: '11px', userSelect: 'none' }}>&gt;</span>
              <input
                type='text'
                placeholder='Type here or select a node in the graph'
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-fg)',
                  fontFamily: 'inherit',
                  fontSize: isMobile ? '12px' : '14px',
                  fontStyle: 'italic',
                }}
              />
            </div>
            {inputError && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '12px',
                  color: 'var(--color-accent)',
                }}
              >
                {inputError}
              </p>
            )}
          </div>

          {/* Nav + Graph — ref tracks the container bottom for ContentPanel's rise cap (SPEC §7) */}
          <div
            ref={navRef}
            style={{
              display: 'flex',
              flex: 1,
              minHeight: 0,
              maxHeight: isMobile ? '60vh' : '45vh',
              gap: '0.5rem',
              flexDirection: isMobile ? 'column' : 'row',
            }}
          >
            {/* Static nav list — vertical column on desktop, wrapping row on mobile */}
            <nav
              ref={navListRef}
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                gap: isMobile ? '4px 12px' : '6px',
                minWidth: isMobile ? undefined : '90px',
                paddingTop: isMobile ? 0 : '2px',
                alignSelf: 'flex-start',
              }}
            >
              {NAV_ITEMS.map((item) => (
                <motion.span
                  key={item}
                  layoutId={`label-${item}`}
                  onClick={() =>
                    selectedId === item ? deselect() : select(item)
                  }
                  animate={{ color: 'var(--color-fg)' }}
                  style={{
                    cursor: 'pointer',
                    opacity: selectedId === item ? 0 : 1,
                    display: 'inline-block',
                  }}
                >
                  {item}
                </motion.span>
              ))}
            </nav>

            {/* Graph — takes remaining width on desktop, full width below nav on mobile */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <PortfolioGraph />
            </div>
          </div>

          {/* Dashed separator — hidden while panel is open; the panel's own borderTop takes over */}
          <div
            ref={separatorRef}
            style={{
              borderTop: '1px dashed var(--color-fg)',
              marginTop: '0.75rem',
              opacity: isMobile || selectedId ? 0 : 1,
              transition: 'opacity 0.15s',
            }}
          />
        </div>
      </div>

      {/* Flying label — fixed overlay, outside the layout flow */}
      <AnimatePresence>
        {selectedId && selectedScreenPos && (
          <motion.span
            key={selectedId}
            layoutId={`label-${selectedId}`}
            animate={{ color: 'var(--color-accent)' }}
            onClick={deselect}
            style={{
              position: 'fixed',
              left:
                selectedId === 'skills' && isMobile
                  ? selectedScreenPos.x + SKILLS_LABEL_OFFSET_X_PX
                  : selectedId === 'skills' && !isMobile
                    ? selectedScreenPos.x - SKILLS_LABEL_DESKTOP_OFFSET_X_PX
                    : selectedId === 'portfolio' && isMobile
                      ? selectedScreenPos.x - PORTFOLIO_LABEL_OFFSET_X_PX
                      : selectedScreenPos.x + 14,
              top:
                selectedId === 'skills' && isMobile
                  ? selectedScreenPos.y + SKILLS_LABEL_OFFSET_Y_PX
                  : selectedId === 'skills' && !isMobile
                    ? selectedScreenPos.y + SKILLS_LABEL_DESKTOP_OFFSET_Y_PX
                    : selectedId === 'portfolio' && isMobile
                      ? selectedScreenPos.y - PORTFOLIO_LABEL_OFFSET_Y_PX
                      : selectedScreenPos.y - 6,
              fontFamily: 'inherit',
              cursor: 'pointer',
              zIndex: 5,
              color: 'var(--color-accent)',
            }}
          >
            <span
              style={
                (selectedId === 'portfolio' && isMobile) ||
                (selectedId === 'skills' && !isMobile)
                  ? { transform: 'translateX(-100%)', display: 'inline-block' }
                  : undefined
              }
            >
              {selectedId}
            </span>
          </motion.span>
        )}
      </AnimatePresence>

      <SkillsOverlay onCardsBottomChange={setSkillsCardsBottom} />

      <ContentPanel
        separatorBottom={
          selectedId === 'skills' && !isMobile
            ? skillsSeparatorBottom
            : separatorBottom
        }
        navBottom={navBottom}
        navListBottom={navListBottom}
      />
    </LayoutGroup>
  );
}

export default App;

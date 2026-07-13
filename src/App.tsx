import './App.css'
import { PortfolioGraph } from './components/PortfolioGraph'

const NAV_ITEMS = ['about', 'portfolio', 'skills', 'articles', 'newsfeed', 'contact', 'socials'] as const

function App() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '2.5rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Where do you want to go? */}
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px' }}>Where do you want to go?</p>
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
              type="text"
              placeholder="Type here or select a node in the graph"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--color-fg)',
                fontFamily: 'inherit',
                fontSize: '11px',
                fontStyle: 'italic',
              }}
            />
          </div>
        </div>

        {/* Nav + Graph */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            maxHeight: '45vh',
            gap: '0.5rem',
          }}
        >
          {/* Static nav list */}
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '90px',
              fontSize: '11px',
              paddingTop: '2px',
            }}
          >
            {NAV_ITEMS.map((item) => (
              <span key={item} style={{ cursor: 'pointer' }}>
                {item}
              </span>
            ))}
          </nav>

          {/* Graph */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <PortfolioGraph />
          </div>
        </div>

        {/* Dashed separator */}
        <div
          style={{
            borderTop: '1px dashed var(--color-fg)',
            marginTop: '0.75rem',
          }}
        />
      </div>
    </div>
  )
}

export default App

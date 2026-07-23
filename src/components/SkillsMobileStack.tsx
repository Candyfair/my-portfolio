import { PanelHeader } from './PanelHeader'

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

export function SkillsMobileStack() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <PanelHeader nodeId="skills" />

      {SKILLS_MOBILE_CARDS.map(card => (
        <div
          key={card.key}
          style={{
            background: 'var(--articles-table-bg)',
            border: '1px solid var(--newsfeed-legend)',
            borderRadius: '12px',
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

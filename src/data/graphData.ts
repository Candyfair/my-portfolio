import type { Node, Edge } from '@xyflow/react'

export const GRAPH_NODES: Node[] = [
  { id: 'about',     type: 'dot', position: { x: 135, y: 0   }, data: {} },
  { id: 'portfolio', type: 'dot', position: { x: 230, y: 48  }, data: {} },
  { id: 'skills',    type: 'dot', position: { x: 50,  y: 78  }, data: {} },
  { id: 'contact',   type: 'dot', position: { x: 0,   y: 175 }, data: {} },
  { id: 'articles',  type: 'dot', position: { x: 82,  y: 226 }, data: {} },
  { id: 'newsfeed',  type: 'dot', position: { x: 45,  y: 318 }, data: {} },
  { id: 'socials',   type: 'dot', position: { x: 104, y: 362 }, data: {} },
]

// Same node IDs in the same order — SKILLS_IDX and all index-based refs remain valid
export const GRAPH_NODES_MOBILE: Node[] = [
  { id: 'about',     type: 'dot', position: { x: 170, y: 20  }, data: {} },
  { id: 'portfolio', type: 'dot', position: { x: 305, y: 65  }, data: {} },
  { id: 'skills',    type: 'dot', position: { x: 100, y: 105 }, data: {} },
  { id: 'contact',   type: 'dot', position: { x: 35,  y: 210 }, data: {} },
  { id: 'articles',  type: 'dot', position: { x: 130, y: 265 }, data: {} },
  { id: 'newsfeed',  type: 'dot', position: { x: 90,  y: 360 }, data: {} },
  { id: 'socials',   type: 'dot', position: { x: 155, y: 405 }, data: {} },
]

export const GRAPH_EDGES: Edge[] = [
  { id: 'e1', source: 'about',    target: 'portfolio', type: 'straight' },
  { id: 'e2', source: 'portfolio', target: 'skills',    type: 'straight' },
  { id: 'e3', source: 'skills',   target: 'contact',   type: 'straight' },
  { id: 'e4', source: 'skills',   target: 'articles',  type: 'straight' },
  { id: 'e5', source: 'articles', target: 'newsfeed',  type: 'straight' },
  { id: 'e6', source: 'newsfeed', target: 'socials',   type: 'straight' },
]

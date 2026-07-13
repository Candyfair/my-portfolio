import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import { ReactFlow, Handle, Position, useNodesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GRAPH_NODES, GRAPH_EDGES } from '../data/graphData'

const DOT_PX = 10
const COLOR = '#958B76'

const hiddenHandle: CSSProperties = {
  opacity: 0,
  width: 1,
  height: 1,
  minWidth: 1,
  minHeight: 1,
  border: 'none',
  background: 'transparent',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
}

function DotNode() {
  return (
    <div style={{ position: 'relative', width: DOT_PX, height: DOT_PX }}>
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <div
        style={{
          width: DOT_PX,
          height: DOT_PX,
          borderRadius: '50%',
          backgroundColor: COLOR,
        }}
      />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
    </div>
  )
}

const nodeTypes = { dot: DotNode }

const defaultEdgeOptions = {
  style: { stroke: COLOR, strokeWidth: 1 },
}

// --- Floating animation ---

type FloatParams = {
  ax: number; ay: number
  fx: number; fy: number
  px: number; py: number
}

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

// Proposed initial ranges — tune visually (SPEC § 4)
const FLOAT_AMPLITUDE = [3, 7]   // px
const FLOAT_FREQ_X   = [0.40, 0.65] // rad/s  → period 9–16 s
const FLOAT_FREQ_Y   = [0.30, 0.55] // rad/s  → period 11–21 s

export function PortfolioGraph() {
  const anchorsRef = useRef(
    GRAPH_NODES.map(n => ({ x: n.position.x, y: n.position.y }))
  )

  const floatParamsRef = useRef<FloatParams[]>(
    GRAPH_NODES.map(() => ({
      ax: randBetween(...FLOAT_AMPLITUDE as [number, number]),
      ay: randBetween(...FLOAT_AMPLITUDE as [number, number]),
      fx: randBetween(...FLOAT_FREQ_X as [number, number]),
      fy: randBetween(...FLOAT_FREQ_Y as [number, number]),
      px: randBetween(0, Math.PI * 2),
      py: randBetween(0, Math.PI * 2),
    }))
  )

  const startRef = useRef(performance.now())
  const [nodes, setNodes, onNodesChange] = useNodesState(GRAPH_NODES)

  useEffect(() => {
    let rafId: number

    function tick() {
      const t = (performance.now() - startRef.current) / 1000
      setNodes(prev =>
        prev.map((node, i) => {
          const p = floatParamsRef.current[i]
          const a = anchorsRef.current[i]
          return {
            ...node,
            position: {
              x: a.x + p.ax * Math.sin(t * p.fx + p.px),
              y: a.y + p.ay * Math.sin(t * p.fy + p.py),
            },
          }
        })
      )
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [setNodes])

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={onNodesChange}
      edges={GRAPH_EDGES}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      nodeOrigin={[0.5, 0.5]}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      attributionPosition="bottom-right"
    />
  )
}

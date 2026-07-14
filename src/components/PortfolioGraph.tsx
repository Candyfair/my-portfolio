import type { CSSProperties } from 'react'
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Node, NodeProps, OnNodesChange } from '@xyflow/react'
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GRAPH_NODES, GRAPH_EDGES } from '../data/graphData'
import { useSelection } from '../context/SelectionContext'

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

function DotNode({ id }: NodeProps) {
  const { selectedId } = useSelection()
  const isSelected = selectedId === id
  return (
    <div style={{ position: 'relative', width: DOT_PX, height: DOT_PX, cursor: 'pointer' }}>
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <div
        style={{
          width: DOT_PX,
          height: DOT_PX,
          borderRadius: '50%',
          backgroundColor: isSelected ? 'var(--color-accent)' : COLOR,
          transition: 'background-color 0.2s ease',
        }}
      />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
    </div>
  )
}

const nodeTypes = { dot: DotNode }
const defaultEdgeOptions = { style: { stroke: COLOR, strokeWidth: 1 } }

// --- Floating animation ---

type FloatParams = {
  ax: number; ay: number
  fx: number; fy: number
  px: number; py: number
}

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

const FLOAT_AMPLITUDE: [number, number] = [3, 7]
const FLOAT_FREQ_X: [number, number] = [0.40, 0.65]
const FLOAT_FREQ_Y: [number, number] = [0.30, 0.55]

// --- Inner component (inside ReactFlowProvider, can use useReactFlow) ---

interface GraphInnerProps {
  nodes: Node[]
  onNodesChange: OnNodesChange
  nodeScreenPosRef: React.MutableRefObject<Record<string, { x: number; y: number }>>
}

function GraphInner({ nodes, onNodesChange, nodeScreenPosRef }: GraphInnerProps) {
  const { flowToScreenPosition } = useReactFlow()
  const flowToScreenRef = useRef(flowToScreenPosition)
  useLayoutEffect(() => {
    flowToScreenRef.current = flowToScreenPosition
  }, [flowToScreenPosition])

  const { selectedId, select, deselect } = useSelection()

  // Keep nodeScreenPosRef in sync with every render (rAF updates nodes 60fps)
  for (const node of nodes) {
    nodeScreenPosRef.current[node.id] = flowToScreenRef.current(node.position)
  }

  function handleNodeClick(_: React.MouseEvent, node: Node) {
    if (selectedId === node.id) deselect()
    else select(node.id)
  }

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={onNodesChange}
      edges={GRAPH_EDGES}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      onNodeClick={handleNodeClick}
      nodeOrigin={[0.5, 0.5]}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      nodesDraggable={false}
      nodesConnectable={false}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      attributionPosition="bottom-right"
    />
  )
}

// --- Outer component ---

export function PortfolioGraph() {
  const { nodeScreenPosRef } = useSelection()

  const anchorsRef = useRef(
    GRAPH_NODES.map(n => ({ x: n.position.x, y: n.position.y }))
  )

  const floatParamsRef = useRef<FloatParams[]>(
    GRAPH_NODES.map(() => ({
      ax: randBetween(...FLOAT_AMPLITUDE),
      ay: randBetween(...FLOAT_AMPLITUDE),
      fx: randBetween(...FLOAT_FREQ_X),
      fy: randBetween(...FLOAT_FREQ_Y),
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
    <ReactFlowProvider>
      <GraphInner
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeScreenPosRef={nodeScreenPosRef}
      />
    </ReactFlowProvider>
  )
}

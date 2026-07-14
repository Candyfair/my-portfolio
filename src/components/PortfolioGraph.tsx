import type { CSSProperties } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import { forceSimulation, forceLink, forceX, forceY } from 'd3-force'
import type { Simulation, SimulationNodeDatum } from 'd3-force'
import { GRAPH_NODES, GRAPH_EDGES } from '../data/graphData'
import { useSelection } from '../context/SelectionContext'

const DOT_PX = 10
const COLOR = '#958B76'
const DRAG_LINK_STRENGTH = 0.08   // spring that pulls neighbors during drag — tune for elastic lag
const NEIGHBOR_RETURN_STRENGTH = 0.005  // weak anchor-return force after release — tune for return speed

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

// --- Drag-settle physics ---

type SimNode = SimulationNodeDatum & { x: number; y: number; vx: number; vy: number }

type SettlingState = {
  draggedId: string
  draggedIndex: number
  neighborIds: string[]
  neighborIndices: number[]
  simNodes: SimNode[]
  sim: Simulation<SimNode, undefined>
}

type BlendState = {
  startTime: number
  startX: number
  startY: number
  duration: number
}

function getNeighborIds(nodeId: string): string[] {
  return GRAPH_EDGES
    .filter(e => e.source === nodeId || e.target === nodeId)
    .map(e => e.source === nodeId ? e.target : e.source)
}

// --- Inner component (inside ReactFlowProvider, can use useReactFlow) ---

interface GraphInnerProps {
  nodes: Node[]
  onNodesChange: OnNodesChange
  nodeScreenPosRef: React.MutableRefObject<Record<string, { x: number; y: number }>>
  draggingNodeIdRef: React.MutableRefObject<string | null>
  draggingNeighborIdsRef: React.MutableRefObject<string[]>
  settlingRef: React.MutableRefObject<SettlingState | null>
  anchorsRef: React.MutableRefObject<{ x: number; y: number }[]>
  nodeBlendRef: React.MutableRefObject<(BlendState | null)[]>
  containerRef: React.MutableRefObject<HTMLDivElement | null>
  nodeExtentRef: React.MutableRefObject<[[number, number], [number, number]] | null>
}

function GraphInner({
  nodes,
  onNodesChange,
  nodeScreenPosRef,
  draggingNodeIdRef,
  draggingNeighborIdsRef,
  settlingRef,
  anchorsRef,
  nodeBlendRef,
  containerRef,
  nodeExtentRef,
}: GraphInnerProps) {
  const { flowToScreenPosition, screenToFlowPosition } = useReactFlow()
  const flowToScreenRef = useRef(flowToScreenPosition)
  useLayoutEffect(() => {
    flowToScreenRef.current = flowToScreenPosition
  }, [flowToScreenPosition])

  // Keep screenToFlowPosition in a ref so the ResizeObserver closure always has the latest
  const screenToFlowRef = useRef(screenToFlowPosition)
  useLayoutEffect(() => {
    screenToFlowRef.current = screenToFlowPosition
  }, [screenToFlowPosition])

  const [nodeExtent, setNodeExtent] = useState<[[number, number], [number, number]] | undefined>(undefined)

  function updateExtent() {
    const el = containerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const tl = screenToFlowRef.current({ x: r.left, y: r.top })
    const br = screenToFlowRef.current({ x: r.right, y: r.bottom })
    const extent: [[number, number], [number, number]] = [[tl.x, tl.y], [br.x, br.y]]
    nodeExtentRef.current = extent
    setNodeExtent(extent)
  }

  // Wire up resize observer to keep extent in sync with container size changes
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(updateExtent)
    ro.observe(el)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { selectedId, select, deselect } = useSelection()

  // Keep nodeScreenPosRef in sync with every render (rAF updates nodes 60fps)
  for (const node of nodes) {
    nodeScreenPosRef.current[node.id] = flowToScreenRef.current(node.position)
  }

  const lastDragPosRef = useRef<{ x: number; y: number } | null>(null)
  const prevDragPosRef = useRef<{ x: number; y: number } | null>(null)

  function handleNodeClick(_: React.MouseEvent, node: Node) {
    if (selectedId === node.id) deselect()
    else select(node.id)
  }

  function handleNodeDragStart(_: MouseEvent | TouchEvent, node: Node, __: Node[]) {
    // Snapshot the current settling state before cleanup so we can hand off positions and velocities
    const oldS = settlingRef.current

    if (oldS) {
      oldS.sim.stop()
      // Instead of letting interrupted nodes jump cold to their anchor via idle float case 4,
      // schedule a short blend from their live sim position back to the idle float curve.
      const now = performance.now()
      nodeBlendRef.current[oldS.draggedIndex] = {
        startTime: now, startX: oldS.simNodes[0].x, startY: oldS.simNodes[0].y, duration: 300,
      }
      oldS.neighborIds.forEach((_, ni) => {
        nodeBlendRef.current[oldS.neighborIndices[ni]] = {
          startTime: now,
          startX: oldS.simNodes[ni + 1].x,
          startY: oldS.simNodes[ni + 1].y,
          duration: 300,
        }
      })
      settlingRef.current = null
    }

    const draggedIndex = GRAPH_NODES.findIndex(n => n.id === node.id)
    const neighborIds = getNeighborIds(node.id)
    const neighborIndices = neighborIds.map(id => GRAPH_NODES.findIndex(n => n.id === id))

    // Nodes entering the new sim are governed by settlingPositions — clear any stale blend entry
    nodeBlendRef.current[draggedIndex] = null
    neighborIndices.forEach(ni => { nodeBlendRef.current[ni] = null })

    // Snapshot natural link distances (current distance between dragged node and each neighbor)
    const naturalDistances = neighborIds.map(id => {
      const n = nodes.find(n => n.id === id)!
      return Math.hypot(node.position.x - n.position.x, node.position.y - n.position.y)
    })

    const simNodes: SimNode[] = [
      // Dragged node: pinned at cursor via fx/fy so the sim tracks it without d3 moving it
      { x: node.position.x, y: node.position.y, vx: 0, vy: 0,
        fx: node.position.x, fy: node.position.y },
      ...neighborIds.map(id => {
        const n = nodes.find(n => n.id === id)!
        // Carry over velocity from old sim if this node was mid-settling — avoids a jerk
        let vx = 0, vy = 0
        if (oldS) {
          if (oldS.draggedId === id) {
            vx = oldS.simNodes[0].vx; vy = oldS.simNodes[0].vy
          } else {
            const ni = oldS.neighborIds.indexOf(id)
            if (ni !== -1) { vx = oldS.simNodes[ni + 1].vx; vy = oldS.simNodes[ni + 1].vy }
          }
        }
        return { x: n.position.x, y: n.position.y, vx, vy }
      }),
    ]

    const links = neighborIds.map((_, i) => ({ source: 0, target: i + 1 }))

    const sim = forceSimulation<SimNode>(simNodes)
      .alphaDecay(0)
      .velocityDecay(0.4)
      .force('link', forceLink(links)
        .distance((_l, i) => naturalDistances[i])
        .strength(DRAG_LINK_STRENGTH)
      )
      .stop()

    settlingRef.current = { draggedId: node.id, draggedIndex, neighborIds, neighborIndices, simNodes, sim }
    draggingNodeIdRef.current = node.id
    draggingNeighborIdsRef.current = neighborIds
    lastDragPosRef.current = null
    prevDragPosRef.current = null
  }

  function handleNodeDrag(_: MouseEvent | TouchEvent, node: Node, __: Node[]) {
    prevDragPosRef.current = lastDragPosRef.current
    lastDragPosRef.current = { x: node.position.x, y: node.position.y }

    // Move the pin so the sim sees the dragged node at its real cursor position each frame
    if (settlingRef.current) {
      const sn0 = settlingRef.current.simNodes[0]
      sn0.x = node.position.x
      sn0.y = node.position.y
      sn0.fx = node.position.x
      sn0.fy = node.position.y
    }
  }

  function handleNodeDragStop(_: MouseEvent | TouchEvent, node: Node, __: Node[]) {
    const s = settlingRef.current
    if (!s) return  // guard: shouldn't happen, but safe

    const curr = lastDragPosRef.current ?? node.position
    const prev = prevDragPosRef.current ?? curr
    const vx = (curr.x - prev.x) * 0.4
    const vy = (curr.y - prev.y) * 0.4

    // Release pin: dragged node now free to move under its own inertia
    const sn0 = s.simNodes[0]
    sn0.fx = null
    sn0.fy = null
    sn0.vx = vx
    sn0.vy = vy

    // Switch to settling phase: remove drag spring, add uniform anchor-return forces for all
    // nodes (dragged + neighbors). Each is pulled back to its original anchor position.
    // alphaDecay stays at 0 so force strength remains constant throughout the return.
    s.sim.force('link', null)
    s.sim.force('ret-x', forceX<SimNode>((_n, i) =>
      i === 0
        ? anchorsRef.current[s.draggedIndex].x
        : anchorsRef.current[s.neighborIndices[i - 1]].x
    ).strength(NEIGHBOR_RETURN_STRENGTH))
    s.sim.force('ret-y', forceY<SimNode>((_n, i) =>
      i === 0
        ? anchorsRef.current[s.draggedIndex].y
        : anchorsRef.current[s.neighborIndices[i - 1]].y
    ).strength(NEIGHBOR_RETURN_STRENGTH))

    draggingNodeIdRef.current = null
    draggingNeighborIdsRef.current = []
    lastDragPosRef.current = null
    prevDragPosRef.current = null
  }

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={onNodesChange}
      edges={GRAPH_EDGES}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      onNodeClick={handleNodeClick}
      onNodeDragStart={handleNodeDragStart}
      onNodeDrag={handleNodeDrag}
      onNodeDragStop={handleNodeDragStop}
      onInit={updateExtent}
      nodeExtent={nodeExtent}
      nodeOrigin={[0.5, 0.5]}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      nodesDraggable={true}
      autoPanOnNodeDrag={false}
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
  const draggingNodeIdRef = useRef<string | null>(null)
  const draggingNeighborIdsRef = useRef<string[]>([])
  const settlingRef = useRef<SettlingState | null>(null)
  const nodeBlendRef = useRef<(BlendState | null)[]>(GRAPH_NODES.map(() => null))
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeExtentRef = useRef<[[number, number], [number, number]] | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(GRAPH_NODES)

  useEffect(() => {
    let rafId: number

    function clampToContainer(pos: { x: number; y: number }) {
      const ext = nodeExtentRef.current
      if (!ext) return pos
      return {
        x: Math.max(ext[0][0], Math.min(ext[1][0], pos.x)),
        y: Math.max(ext[0][1], Math.min(ext[1][1], pos.y)),
      }
    }

    function tick() {
      const now = performance.now()
      const t = (now - startRef.current) / 1000

      // Advance the settling sim and snapshot positions into a plain local array.
      // This is intentional: setNodes callbacks are closures — if we read settlingRef
      // inside the callback, React may defer the render long enough for a later tick
      // to null-out settlingRef, causing neighbors to snap to idle-float. Capturing
      // positions here (before calling setNodes) makes each callback self-contained.
      type PosSnapshot = { id: string; x: number; y: number }
      let settlingPositions: PosSnapshot[] | null = null

      if (settlingRef.current) {
        const s = settlingRef.current
        s.sim.tick()
        const sn0 = s.simNodes[0]
        const isDragging = draggingNodeIdRef.current !== null

        if (!isDragging) {
          // All nodes (dragged + neighbors) return to their original anchors via ret-x/ret-y.
          // Release sim only when every node's velocity is negligible.
          const allSettled = s.simNodes.every(sn => Math.hypot(sn.vx ?? 0, sn.vy ?? 0) < 0.02)
          if (allSettled) {
            settlingRef.current = null
            // settlingPositions stays null → all nodes fall through to idle float this frame ✓
          }
        }

        if (settlingRef.current) {
          settlingPositions = [
            { id: s.draggedId, x: sn0.x, y: sn0.y },
            ...s.neighborIds.map((id, ni) => ({
              id,
              x: s.simNodes[ni + 1].x,
              y: s.simNodes[ni + 1].y,
            })),
          ]
        }
      }

      // Capture current drag state as a local value for the closure below
      const draggingId = draggingNodeIdRef.current

      setNodes(prev =>
        prev.map((node, i) => {
          // 1. Actively dragged — React Flow owns the position
          if (draggingId === node.id) return node

          // 2+3. Sim active (drag or settling) — apply positions from this frame's tick
          if (settlingPositions) {
            const sp = settlingPositions.find(p => p.id === node.id)
            if (sp) return { ...node, position: clampToContainer({ x: sp.x, y: sp.y }) }
          }

          // 4. Idle float — with short blend when interrupted from a previous settling sim
          const p = floatParamsRef.current[i]
          const a = anchorsRef.current[i]
          const idleX = a.x + p.ax * Math.sin(t * p.fx + p.px)
          const idleY = a.y + p.ay * Math.sin(t * p.fy + p.py)

          const blend = nodeBlendRef.current[i]
          if (blend) {
            const elapsed = now - blend.startTime
            const progress = Math.min(1, elapsed / blend.duration)
            const eased = 1 - Math.pow(1 - progress, 3)  // ease-out cubic
            if (progress >= 1) nodeBlendRef.current[i] = null
            return {
              ...node,
              position: clampToContainer({
                x: blend.startX + (idleX - blend.startX) * eased,
                y: blend.startY + (idleY - blend.startY) * eased,
              }),
            }
          }

          return {
            ...node,
            position: clampToContainer({ x: idleX, y: idleY }),
          }
        })
      )
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [setNodes])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlowProvider>
        <GraphInner
          nodes={nodes}
          onNodesChange={onNodesChange}
          nodeScreenPosRef={nodeScreenPosRef}
          draggingNodeIdRef={draggingNodeIdRef}
          draggingNeighborIdsRef={draggingNeighborIdsRef}
          settlingRef={settlingRef}
          anchorsRef={anchorsRef}
          nodeBlendRef={nodeBlendRef}
          containerRef={containerRef}
          nodeExtentRef={nodeExtentRef}
        />
      </ReactFlowProvider>
    </div>
  )
}

import type { CSSProperties } from 'react'
import { ReactFlow, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GRAPH_NODES, GRAPH_EDGES } from '../data/graphData'

const DOT_PX = 10
const COLOR = '#6e6a61'

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

export function PortfolioGraph() {
  return (
    <ReactFlow
      nodes={GRAPH_NODES}
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

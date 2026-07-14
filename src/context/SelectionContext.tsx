import { createContext, useContext, useRef, useState } from 'react'
import type { MutableRefObject, ReactNode } from 'react'

interface ScreenPos { x: number; y: number }

interface SelectionCtx {
  selectedId: string | null
  selectedScreenPos: ScreenPos | null
  nodeScreenPosRef: MutableRefObject<Record<string, ScreenPos>>
  select: (id: string) => void
  deselect: () => void
}

const SelectionContext = createContext<SelectionCtx>({
  selectedId: null,
  selectedScreenPos: null,
  nodeScreenPosRef: { current: {} },
  select: () => {},
  deselect: () => {},
})

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedScreenPos, setSelectedScreenPos] = useState<ScreenPos | null>(null)
  const nodeScreenPosRef = useRef<Record<string, ScreenPos>>({})

  function select(id: string) {
    setSelectedId(id)
    setSelectedScreenPos(nodeScreenPosRef.current[id] ?? null)
  }

  function deselect() {
    setSelectedId(null)
    setSelectedScreenPos(null)
  }

  return (
    <SelectionContext.Provider value={{ selectedId, selectedScreenPos, nodeScreenPosRef, select, deselect }}>
      {children}
    </SelectionContext.Provider>
  )
}

export const useSelection = () => useContext(SelectionContext)

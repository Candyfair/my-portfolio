import { createContext, useContext, useRef, useState } from 'react'
import type { MutableRefObject, ReactNode } from 'react'

interface ScreenPos { x: number; y: number }

interface SelectionCtx {
  selectedId: string | null
  selectedScreenPos: ScreenPos | null
  nodeScreenPosRef: MutableRefObject<Record<string, ScreenPos>>
  articlesAnchorScreenPosRef: MutableRefObject<ScreenPos | null>
  select: (id: string) => void
  deselect: () => void
  isArticleDetailOpen: boolean
  setIsArticleDetailOpen: (open: boolean) => void
}

const SelectionContext = createContext<SelectionCtx>({
  selectedId: null,
  selectedScreenPos: null,
  nodeScreenPosRef: { current: {} },
  articlesAnchorScreenPosRef: { current: null },
  select: () => {},
  deselect: () => {},
  isArticleDetailOpen: false,
  setIsArticleDetailOpen: () => {},
})

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedScreenPos, setSelectedScreenPos] = useState<ScreenPos | null>(null)
  const nodeScreenPosRef = useRef<Record<string, ScreenPos>>({})
  const articlesAnchorScreenPosRef = useRef<ScreenPos | null>(null)
  const [isArticleDetailOpen, setIsArticleDetailOpen] = useState(false)

  function select(id: string) {
    setSelectedId(id)
    setSelectedScreenPos(nodeScreenPosRef.current[id] ?? null)
    setIsArticleDetailOpen(false)
  }

  function deselect() {
    setSelectedId(null)
    setSelectedScreenPos(null)
    setIsArticleDetailOpen(false)
  }

  return (
    <SelectionContext.Provider value={{ selectedId, selectedScreenPos, nodeScreenPosRef, articlesAnchorScreenPosRef, select, deselect, isArticleDetailOpen, setIsArticleDetailOpen }}>
      {children}
    </SelectionContext.Provider>
  )
}

export const useSelection = () => useContext(SelectionContext)

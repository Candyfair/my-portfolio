# CLAUDE.md

## Project overview

Interactive portfolio website for Candice Fairand (Frontend & Mobile Engineer — React, React Native, TypeScript). The main navigation is an Obsidian-style force-directed graph, occupying roughly 30-50% of the viewport height, sitting above a content panel. There is no traditional routing: this is a single-page app, and the graph is the only way to navigate.

Full design reference: see `/design` (Figma exports) and `SPEC.md` for the complete behavioral specification.

## Tech stack

- Vite + React + TypeScript
- React Flow — graph rendering, node dragging, pan/zoom, touch handling
- d3-force — used ONLY for the transient physics simulation triggered by node dragging. Never for idle animation or initial layout.
- TailwindCSS — styling
- Framer Motion — content panel transitions, skills overlay animations
- State sync (graph ↔ content panel): [Zustand or Context — TBD, confirm before first use]

## Key architectural decisions — do not deviate without checking SPEC.md

1. **Idle floating animation**: NOT driven by d3-force. A `requestAnimationFrame` loop applies a per-node sinusoidal position offset around a fixed anchor, with amplitude/frequency/phase randomized once per node at init (organic, desynchronized motion). See SPEC.md § 4.
2. **Drag physics**: d3-force simulation instantiated only on `onNodeDragStart`, with a standard (non-zero) `alphaDecay` so it settles and stops. The dragged node's post-drag resting position becomes its NEW floating anchor — it does not snap back to its original position. Other nodes' idle floating is never interrupted by another node's drag. See SPEC.md § 5.
3. **Skills node sub-content**: NOT real React Flow nodes/edges. An HTML overlay component, absolutely positioned relative to the skills node's live screen coordinates (recalculated on pan/zoom). See SPEC.md § 8.
4. **Content panel**: fixed-position container, opaque background. Can grow and visually cover the lower part of the graph, fully hiding covered nodes. Only the panel's own content scrolls (`overflow-y: auto`) — never the page. See SPEC.md § 7.
5. **Node selection**: camera/viewport never moves. The selected node's label animates (position + color) from the static nav list to sit beside its node in the graph. Deselection reverses this exactly.

## Coding conventions

- Variable names and code comments: English, always.
- Functional components + hooks throughout.
- [File/folder structure — to fill in once scaffolded]

## Commands

[To fill in once package.json exists — dev server, build, lint, test]

## Reference

- `SPEC.md` — full behavioral specification (animations, timings, content types, mobile adaptations, open items)
- `/design` — Figma exports (desktop + mobile) for every section

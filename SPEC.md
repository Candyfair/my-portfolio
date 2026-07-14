# SPEC.md — Portfolio site behavioral specification

Living document. Update it whenever a design decision changes — this is the source of truth Claude Code should be pointed to for anything not covered by CLAUDE.md's high-level rules.

## 1. Overview

Single-page app. Layout, top to bottom:
1. "Where do you want to go?" input (free text or node selection)
2. Static nav list of the 7 section names
3. Force-directed graph (React Flow), ~30-50% of viewport height
4. Dashed separator
5. Content panel (appears once a node is selected)

## 2. Stack

Vite + React + TypeScript, React Flow, d3-force (drag physics only), TailwindCSS, Framer Motion. See CLAUDE.md for the full list and rationale.

## 3. Graph structure

7 primary nodes: `about`, `portfolio`, `skills`, `articles`, `newsfeed`, `contact`, `socials`.
Positions are fixed/deterministic at init, matching the constellation layout shown in the Figma mockups (Home.png / MOBILE__Home.png) — NOT computed by a live force layout.

6 edges (directed, source → target):
`about → portfolio`, `portfolio → skills`, `skills → contact`, `skills → articles`, `articles → newsfeed`, `newsfeed → socials`.

## 4. Idle floating animation

- Driven by `requestAnimationFrame`, not d3-force.
- Each node gets a randomized amplitude, frequency, and phase offset at initialization (same spirit as the per-node `floatAngle`/`floatSpeed` randomization in the RADA project's `BubbleChart.js`, but implemented as a direct position calculation rather than an accumulated-velocity force).
- Formula sketch: `position = anchor + amplitude * sin(elapsedTime * frequency + phase)`, independently per axis if a circular/elliptical drift is wanted.
- Exact amplitude/frequency ranges: not yet fixed — tune visually against the mockup once the graph is on screen. Do not hardcode values without visual review.

## 5. Drag interaction physics

- A d3-force simulation is instantiated on `onNodeDragStart`, scoped to the dragged node (and possibly its direct graph neighbors — confirm before implementing neighbor propagation).
- Standard `alphaDecay` (not 0 — unlike RADA, this simulation must settle and stop).
- On settle, the affected node's new position becomes its new floating anchor (a nearby resting position, not a snap-back to the original mockup coordinates).
- All other nodes' idle floating (§4) continues uninterrupted during any drag.

## 6. Node selection behavior

- The graph's camera/viewport never moves or zooms on node selection.
- Selecting a node: its label animates — position AND color — from its slot in the static nav list to a position beside its node in the graph, transitioning to orange during the move.
- Deselecting: the exact reverse animation (label returns to the nav list, color reverts).
- The content panel appears below the dashed separator.

## 7. Content panel

- Fixed-position container, opaque background.
- Can grow in height as content requires; when content is large (e.g. `about`), the panel can visually cover the lower part of the graph, fully hiding any nodes underneath it.
- Panel top position has 3 regimes based on measured content height:
  1. Short content: pinned at the separator's natural resting position
     (right after the graph), height = content (auto, no stretch).
  2. Medium content: panel top (and the separator, moving with it) rises to
     stay exactly fitted to content height — top = 100vh - contentHeight.
  3. Long content: rise is capped at the nav container's bottom edge
     (measured via ref) — panel stops rising and scrolls internally instead.
- Height changes are animated (smooth slide/height transition), not instant.
- Only the panel's own content scrolls (`overflow-y: auto`) when it overflows — the page itself never scrolls.
- Content type per node:
  - `portfolio`, `articles` → table
  - `newsfeed` → terminal-styled log box
  - `contact` → form (email + message + send)
  - `about` → plain text bio
  - `socials` → link list
  - `skills` → see §8

## 8. Skills node — special behavior

- Sub-categories are rendered as an HTML overlay component, NOT as real React Flow nodes/edges (deliberate simplification — see CLAUDE.md §3 for rationale: avoids reconciling two very different desktop/mobile layouts within the graph's coordinate system, and these elements have no drag/float/physics behavior of their own).
- Desktop: cards appear sequentially, ease-in, order TBD. The skills node itself grows smoothly (no jump) up to 3× its original size, in step with the cards appearing.
- Cards are static once shown (no floating).
- Mobile: same node growth animation; cards stack vertically instead of radiating.
- Deselecting skills: node shrinks back to its original size/color with animation; the "skills" label reverses its slide-to-orange animation back into the nav list (same as §6, general case).
- Overlay position must track the skills node's live screen coordinates if the user pans/zooms the canvas while it's open (same principle as a zoom-aware label layer).

## 9. Project case-study sub-page

Clicking a project row in the `portfolio` table opens a full case-study view (text + screenshots, see Portfolio__Page_de_projet.png).
**OPEN QUESTION — not yet specified:** does this replace the content panel entirely, stack as a new panel, or something else? Do not implement until this is confirmed.

## 10. Mobile adaptations

- Nav list wraps across multiple lines.
- Graph is full-width.
- Skills sub-content becomes a vertical card stack (§8).
- [Breakpoint values — TBD]

## 11. Open items — do not assume, ask before implementing

- `newsfeed` content and `articles` list will be sourced from the Ghost blog API (not static/hardcoded). `portfolio` case-studies (§9) will also be sourced from Ghost. Integration details (Ghost Content API setup, data shape, caching) are NOT yet specified — do not implement until this is scoped in a dedicated session.
- Exact stagger order for skills cards
- Exact floating animation parameters (amplitude/frequency ranges)
- Behavior of the project case-study sub-page (§9)
- Zustand vs Context for graph ↔ panel state sync
- Whether drag physics propagates to the dragged node's direct neighbors or only the dragged node itself
- Exact color/design tokens beyond grey (default) / orange (active)

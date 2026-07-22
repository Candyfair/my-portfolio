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
Positions are fixed/deterministic at init, matching the constellation layout shown in the Figma mockups (Home.png / MOBILE\_\_Home.png) — NOT computed by a live force layout.

6 edges (directed, source → target):
`about → portfolio`, `portfolio → skills`, `skills → contact`, `skills → articles`, `articles → newsfeed`, `newsfeed → socials`.

## 4. Idle floating animation

- Driven by `requestAnimationFrame`, not d3-force.
- Each node gets a randomized amplitude, frequency, and phase offset at initialization (same spirit as the per-node `floatAngle`/`floatSpeed` randomization in the RADA project's `BubbleChart.js`, but implemented as a direct position calculation rather than an accumulated-velocity force).
- Formula sketch: `position = anchor + amplitude * sin(elapsedTime * frequency + phase)`, independently per axis if a circular/elliptical drift is wanted.
- Exact amplitude/frequency ranges: not yet fixed — tune visually against the mockup once the graph is on screen. Do not hardcode values without visual review.

## 5. Drag interaction physics

- A d3-force simulation is instantiated on `onNodeDragStart`, scoped to the dragged node and its direct graph neighbors.
- `alphaDecay = 0` throughout (drag phase and settling phase); simulation is terminated by velocity checks, not by alpha decay.
- `velocityDecay = 0.4` (moderate friction).

**During drag:**

- Dragged node is pinned (`fx`/`fy`) at its real cursor position, updated each `onNodeDrag`. React Flow owns its rendered position; the pin keeps the sim in sync.
- Neighbors are connected to the pinned node via `forceLink` (`DRAG_LINK_STRENGTH = 0.08`), computed at the natural link distance measured at drag start. They trail behind with elastic lag — links visibly stretch.
- `autoPanOnNodeDrag = false` to prevent the viewport shifting when a node approaches the canvas edge.
- Node positions are clamped to the container bounds (`nodeExtent`) via `screenToFlowPosition`, updated on `onInit` and `ResizeObserver`.

**On drag release (`onNodeDragStop`):**

- Pin is released (`fx`/`fy = null`); dragged node receives the velocity captured from the last two `onNodeDrag` positions (`Δpos × 0.4 scaling`).
- `forceLink` is removed. Weak `forceX`/`forceY` forces (`NEIGHBOR_RETURN_STRENGTH = 0.005`) are applied uniformly to all nodes in the sim — dragged node and neighbors alike — each pulled toward its **original** anchor. The dragged node returns to its original position; it does not keep its drop position as a new anchor.
- No additional velocity impulse is given to neighbors at release — they carry whatever velocity they accumulated from the link spring during drag.

**Settling (single phase):**

- All nodes converge toward their original anchors under the return forces.
- `settlingRef` is cleared when every node's velocity falls below `0.02 px/frame`.
- All node positions written by the sim are passed through `clampToContainer()` before being set on the React Flow node state.
- Nodes not involved in the drag continue idle floating (§4) uninterrupted throughout.

**New drag interrupting active settling:**

- When a second drag starts while nodes are still settling from a prior drag, those nodes would otherwise snap abruptly to their anchor (falling cold into the idle-float formula). Instead:
  - Each node from the interrupted sim records a `BlendState` (its live sim position at interruption time).
  - For 300 ms, that node interpolates from its captured position toward the live idle-float curve using an ease-out cubic, then resumes idle float seamlessly. No domain constraint — works regardless of how far the node was from its anchor.
  - Nodes that are also neighbors of the new drag skip the blend (the new sim governs them immediately).
  - Velocity from the old sim is carried into the new sim for any node that transitions between sims, avoiding a velocity jerk.

## 6. Node selection behavior

- The graph's camera/viewport never moves or zooms on node selection.
- Selecting a node: its label animates — position AND color — from its slot in the static nav list to a position beside its node in the graph, transitioning to orange during the move.
- Deselecting: the exact reverse animation (label returns to the nav list, color reverts).
- The content panel appears below the dashed separator.

## 6bis. Search input navigation

Typing a node name into the "Where do you want to go?" input and pressing
Enter triggers the exact same select() behavior as clicking that node
(case-insensitive, trimmed). Non-matching input on Enter shows a text
error message below the input, cleared on next input change.

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

  ### Mobile panel vertical positioning (riseCap pattern)

  On mobile, each graph node uses an independent panel-positioning strategy in
  `ContentPanel.tsx` rather than a shared formula, consistent with the
  project's "independent constants per node" principle.
  - `skills`, `newsfeed`, and `socials` each own a dedicated
    `<NODE>_MOBILE_NODE_CLEARANCE_PX` constant and a dedicated branch in the
    `riseCap` calculation (`selectedScreenPos.y + DOT_PX / 2 + clearance`,
    capped at `separatorBottom`).
  - All other nodes (`contact`, `about`, `articles`, `portfolio`) fall back to
    the generic branch, which combines `riseCap` with a bottom-anchored
    position derived from the actual rendered content height
    (`Math.max(riseCap, Math.min(separatorBottom, windowH - contentHeight))`),
    keeping short-content panels anchored near the bottom of the screen
    rather than floating mid-screen.
  - `socials` additionally bypasses this generic bottom-anchor logic entirely
    (`panelTop = riseCap` directly), because its very short content otherwise
    makes the bottom-anchor branch always win over `riseCap`, rendering its
    dedicated clearance constant ineffective. If any other node's content
    becomes short enough to trigger the same issue, apply the same bypass
    rather than modifying the shared bottom-anchor formula.

## 8. Skills node — special behavior

- Sub-categories are rendered as an HTML overlay component, NOT as real React Flow nodes/edges (deliberate simplification — see CLAUDE.md §3 for rationale: avoids reconciling two very different desktop/mobile layouts within the graph's coordinate system, and these elements have no drag/float/physics behavior of their own).
- Desktop: cards appear sequentially, ease-in, order TBD. The skills node itself grows smoothly (no jump) up to 3× its original size, in step with the cards appearing.
- Cards are static once shown (no floating).
- Mobile: same node growth animation; cards stack vertically instead of radiating.
- Deselecting skills: node shrinks back to its original size/color with animation; the "skills" label reverses its slide-to-orange animation back into the nav list (same as §6, general case).
- Overlay position must track the skills node's live screen coordinates if the user pans/zooms the canvas while it's open (same principle as a zoom-aware label layer).

## 9. Contact Form — special behavior

- Submission handled via Web3Forms (fetch POST to api.web3forms.com/submit) instead of EmailJS or Formspree. EmailJS requires connecting a full email account (OAuth/SMTP), incompatible with Proton Mail's Bridge model (paid-only, requires a local desktop app rather than a cloud-reachable SMTP endpoint). Web3Forms only requires verifying a destination email address, works with any provider. Preferred over Formspree for its higher free-tier volume (250 vs 50 submissions/month) and simpler setup (access key, no password) — trade-off accepted: no submission dashboard/archive, acceptable for expected volume.
- No react-hook-form: only 2 fields (email, message), no cross-field validation. Native HTML5 attributes (`required`, `type="email"`, `minLength`) cover validation, enforced via `form.reportValidity()`. State handled with plain `useState`, 4 states: `idle` / `sending` / `success` / `error`.
- `WEB3FORMS_ACCESS_KEY` is a named constant inside `ContactForm.tsx`, not an env variable — Web3Forms designs this key to be public client-side (acts as an alias to the destination email, not a secret).
- Success feedback: floating toast, styled after SkillsOverlay's card convention (border, padding, font), fade in/out via Framer Motion, auto-dismiss after `CONTACT_TOAST_DISPLAY_DURATION_MS`. Scoped entirely to `ContactForm.tsx` — `ContentPanel.tsx` untouched.
- Toast is positioned `top: 0` over the form, not floating above it (`bottom: '100%'` was the initial attempt, but the panel's shared height-regime system clips at y=0 via both `overflowY: auto` and an animated `clip-path` — nothing renders above that edge, in-flow or not).
- Error feedback stays inline at its original position under the button (not a toast), styled via a new `--color-error` CSS variable added alongside `--color-bg`/`--color-fg`/`--color-accent`.

## 9bis. Newsfeed — special behavior

- Content is sourced from the Ghost Content API (`https://candygetshandy.com/ghost/api/content/posts/`), fetching the 6 latest posts tagged `#newsfeed` (title + published date only, via `fields=id,slug,title,published_at`). Native `fetch`, no `@tryghost/content-api` dependency — same rationale as Web3Forms for the contact form: no build-time SDK needed for a couple of read-only calls.
- `GHOST_CONTENT_API_KEY` is a named constant inside `ghostClient.ts`, not an env variable — Ghost designs Content API keys to be public/client-safe (read-only, scoped to published content), same trust model as `WEB3FORMS_ACCESS_KEY`.
- Requests pin the API response format to the live Ghost install (6.42.0) via an `Accept-Version: v6.42` header, so future Ghost upgrades on the CMS side don't silently change the response shape underneath the client.
- `getPostBySlug(slug)` is implemented in `ghostClient.ts` alongside `getPostsByTag` but not yet called anywhere — reserved for the future `articles`/`portfolio` Ghost integration (still unscoped, see §12).
- State: plain `useState`, 3 states: `loading` / `success` / `error` — no `idle`, the fetch starts immediately on mount.
- Empty state (`success` with zero posts) shows a static "Nothing here yet." message from `newsfeedContent.ts`, distinct from the `error` state.
- The title is followed by a permanent animated ellipsis (`.newsfeed-dots`, CSS `steps(4, end)` animation, `infinite`) — a decorative terminal-cursor flourish, not a loading indicator; it animates regardless of fetch status.
- Styled via three new CSS variables (`--newsfeed-bg`, `--newsfeed-accent`, `--newsfeed-legend`) added alongside the existing `--color-*` variables, following the same precedent as `--color-error`. All other styling stays inline `CSSProperties`, matching `ContactForm.tsx`'s convention.
- Desktop: date and title render inline on one line per post. Mobile (`useIsMobile`, existing 768px breakpoint): date and title stack on two separate lines.
- Scoped entirely to `NewsfeedContent.tsx` / `ghostClient.ts` / `formatPostDate.ts` / `newsfeedContent.ts` — `ContentPanel.tsx` only swaps its placeholder for `<NewsfeedContent />`, the 3-regime height system (§7) is untouched.

## 9ter. Articles — special behavior

- Content is sourced from the Ghost Content API, same client as newsfeed: fetches posts tagged `ux-coding` via `getPostsByTag('ux-coding', 20)` (title + published date only). No new API client code — `ghostClient.ts` is reused unmodified.
- Rendered as a table (per §7: `articles` → table, distinct from newsfeed's terminal-log box), 3 columns: `#` (row position in the fetched order, not a Ghost field), `Title`, `Date`.
- Mobile (`useIsMobile`, existing 768px breakpoint, no new breakpoint introduced): the `Date` column (header + cells) is hidden, leaving `#` and `Title`.
- State: same 3-state model as newsfeed (`loading` / `success` / `error`, plain `useState`, no `idle`) — fetch starts immediately on mount, same cancellation-flag pattern.
- Empty (`success` with zero posts) and error copy come from `articlesContent.ts`, same separation of static UI copy vs. live post data as `newsfeedContent.ts`.
- Rows show a pointer cursor and a hover state (text color shifts to `--color-accent`, via a `.articles-row` CSS class — same technique as `.newsfeed-legend-link:hover`, an inline color would beat `:hover` regardless of specificity).
- Clicking a row opens an in-app detail view (rendered inside the same panel, no external link to the blog) fetched via `getPostBySlug(slug)`. The `<tr>` carries the click for mouse convenience, but the actual keyboard-/screen-reader-accessible control is a `<button>` wrapping the title cell's content — a `role`/`tabIndex` on `<tr>` itself would break table semantics for assistive tech.
- Detail view: its own independent 3-state fetch (`loading` / `success` / `error`, separate from the list's), a `"> articles"` back button (`<button type="button">`, CSS-reset, `.articles-back-link` hover class) returning to the list, then title + date + `dangerouslySetInnerHTML` article body (trusted source — own Ghost blog, no sanitization lib). Images are made responsive via a `.article-body img { max-width: 100%; height: auto; }` rule in `index.css`. A `"Loading…"` message covers the detail fetch's `loading` state (`articlesContent.ts`) — unlike the list, which loads silently on mount, the detail fetch is triggered by an explicit user click, so an empty panel during the fetch would read as unresponsive.
- Switching back to the list re-uses the already-fetched `posts` state (no re-fetch); returning to the node from scratch (deselect/reselect) always resets to the list view, since the whole component unmounts with `selectedId`.
- No new CSS custom properties beyond `.article-body img` / `.articles-back-link` — styled with the existing `--color-fg` / `--color-accent` / `--color-error` variables, unlike newsfeed's dedicated `--newsfeed-*` set.
- Scoped entirely to `ArticlesContent.tsx` / `articlesContent.ts`, plus the two CSS rules above in `index.css` (same file already extended for `.articles-row`/`.articles-table-*`) — `ghostClient.ts` and `ContentPanel.tsx` untouched; the 3-regime height system (§7) applies to the detail view automatically since it measures content height generically.

## 10. Project case-study sub-page

Clicking a project row in the `portfolio` table opens a full case-study view (text + screenshots, see `Portfolio__Page_de_projet.png`).
**OPEN QUESTION — not yet specified:** does this replace the content panel entirely, stack as a new panel, or something else? Do not implement until this is confirmed.

## 11. Mobile adaptations

- Nav list wraps across multiple lines.
- Graph is full-width.
- Skills sub-content becomes a vertical card stack (§8).
- [Breakpoint values — TBD]

## 12. Open items — do not assume, ask before implementing

- `portfolio` case-studies will also be sourced from the Ghost blog API. Integration details (data shape, caching) are NOT yet specified — do not implement until this is scoped in a dedicated session. (`newsfeed` and `articles` are implemented — see §9bis and §9ter.)
- Exact stagger order for skills cards
- Exact floating animation parameters (amplitude/frequency ranges)
- Behavior of the project case-study sub-page (§9)
- Zustand vs Context for graph ↔ panel state sync
- Whether drag physics propagates to the dragged node's direct neighbors or only the dragged node itself
- Exact color/design tokens beyond grey (default) / orange (active)
- Input field visual styling does not yet match the mockup (colors, border, font) — pending a dedicated visual-polish pass.
- Diagnostic sur l'utilisation de Tailwind dans le projet

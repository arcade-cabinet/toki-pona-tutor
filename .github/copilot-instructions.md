# GitHub Copilot instructions — poki soweli

GitHub Copilot should follow the same operating protocols as any other agent working in this repo. Read these files in order before proposing any code; they are the authoritative source:

1. `CLAUDE.md` — project identity, critical rules, commands, structure.
2. `AGENTS.md` — extended operating protocols, stack, pipelines, testing strategy.
3. `docs/STATE.md` — current branch state, hard rules, known limits.
4. `docs/ROADMAP.md` — what's done, partial, open. Every task has a stable `T<phase>-<n>` ID.
5. `docs/ARCHITECTURE.md` — stack layout.
6. `docs/DESIGN.md` — product vision.
7. `docs/BRAND.md` — palette + typography + chrome.
8. `docs/UX.md` — HUD architecture + input model + `data-testid` contract.
9. `docs/TESTING.md` — five-layer testing strategy + E2E-first policy.

## Critical constraints (do not violate)

- **Docs > tests > code.** Never write tests to match existing code. Never write code without a doc-driven test.
- **No hand-authored toki pona.** Every user-facing TP string round-trips through `src/content/corpus/tatoeba.json` via `pnpm validate-tp`. Authors write EN; the pipeline resolves TP.
- **Maps are build artifacts.** Edit `scripts/map-authoring/specs/<id>.ts`, run `pnpm author:build <id>`. Never edit `src/tiled/*.tmx` or `public/assets/maps/*.tmj` by hand.
- **Fan-tasy tileset family only.** No mixing art styles.
- **No `localStorage` / `IndexedDB` in feature code.** Use `src/platform/persistence/preferences.ts` or `src/platform/persistence/database.ts` only.
- **No CDN at runtime.** Fonts, wasm, assets — all self-hosted under `public/assets/`.
- **Mobile-first, tap-to-walk primary.** No persistent A/B/d-pad cluster. Keyboard is a desktop shortcut.
- **No trademarked references.** The game is "poki soweli — a creature-catching RPG." Never name, compare against, or derive terminology from any specific franchise.
- **GitHub Actions pinned to exact SHAs.** Never `@vN` tags.
- **Conventional Commits** always. Squash-merge.
- **GUI is RPG.js-native.** Custom surfaces are `.ce` (CanvasEngine) components, not Vue / React / Solid.

## When suggesting code

- Match the nearest existing pattern. Read the closest file before generating.
- Import via the Vite-resolved paths; no `require()`, no `.js` extensions on TypeScript imports.
- Use the BRAND.md tokens (`--poki-*` / `var(--primary)` etc.) for every color; never raw hex.
- Use the fonts.css family tokens (`--font-body` / `--font-display` / `--font-mono` / `--font-glyph`); never raw family names.
- Every tap/click target carries a stable `data-testid` so E2E can drive it.

## When suggesting commits

Follow Conventional Commits. Scope the message to what actually changed. Never claim behavior that isn't verified.

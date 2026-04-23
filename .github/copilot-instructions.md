# GitHub Copilot instructions — Rivers Reckoning

GitHub Copilot should follow the same operating protocols as any other agent working in this repo. Read these files in order before proposing code:

1. `CLAUDE.md` — quick orientation, critical rules, commands, structure.
2. `AGENTS.md` — extended protocols, stack, pipelines, testing strategy.
3. `docs/STATE.md` — current branch state, verified gates, known limits.
4. `docs/ROADMAP.md` — done, partial, open work.
5. `docs/ARCHITECTURE.md` — stack layout.
6. `docs/DESIGN.md` — product vision.
7. `docs/BRAND.md` — palette, typography, chrome.
8. `docs/UX.md` — HUD architecture, input model, `data-testid` contract.
9. `docs/TESTING.md` — testing strategy and visual-audit expectations.

## Critical Constraints

- **Docs > tests > code.** Never write tests to match existing code. Never write code without a doc-driven test.
- **Native-English content only.** Do not reintroduce the removed language-learning or corpus translation layer. Story, quests, NPCs, encounters, and UI are authored directly in English.
- **Clues, not vocabulary drills.** Investigation progress lives in `src/content/clues.json` and the clue journal. Compatibility DB/table names may still say `mastered_words`, but product copy must not.
- **Maps are build artifacts.** Edit `scripts/map-authoring/specs/<id>.ts`, run `pnpm author:build <id>` or `pnpm author:all --all`. Never edit `src/tiled/*.tmx` or `public/assets/maps/*.tmj` by hand.
- **Curated art only.** Map palette entries should resolve through `src/content/art/tilesets.json`; rejected tiles stay rejected.
- **No direct `localStorage` / `IndexedDB` in feature code.** Use `src/platform/persistence/preferences.ts` or `src/platform/persistence/database.ts` only.
- **No CDN at runtime.** Fonts, wasm, and assets are self-hosted under `public/assets/`.
- **Mobile-first, tap-to-walk primary.** Keyboard is a desktop shortcut; every action must remain mouse/tap reachable.
- **No trademarked references.** The game is Rivers Reckoning, a creature-catching RPG. Never compare it to or derive terminology from a specific franchise.
- **GitHub Actions pinned to exact SHAs.** Never use floating `@vN` action tags.
- **Conventional Commits** always. Squash-merge.
- **GUI is rr-ui.** RPG.js `.ce` files are bridge adapters only; player-facing chrome lives in `src/ui/` React components mounted beside the RPG.js canvas.

## When Suggesting Code

- Match the nearest existing pattern. Read the closest file before generating.
- Import via Vite-resolved paths; no `require()`, no `.js` extensions on TypeScript imports.
- Use `docs/BRAND.md` tokens and the existing CSS variables for colors/fonts.
- Every tap/click target carries a stable `data-testid` so E2E can drive it.

## When Suggesting Commits

Follow Conventional Commits. Scope the message to what actually changed. Never claim behavior that is not verified.

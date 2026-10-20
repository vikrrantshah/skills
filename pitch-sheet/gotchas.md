# Gotchas

The traps that silently wrecked earlier sheets. The first two render *wrong with no error*, so they cost the most rounds — `check.mjs` now catches both. The rest are process flakes with known fixes.

## 1. `clamp()` / `calc()` math needs spaces around `+` and `-` (the "everything is tiny" bug)

In the browser, `clamp(1.5rem+3.2vw, …)` — a `+` with **no surrounding spaces** — is an **invalid** value. The property silently falls back (a `font-size` drops to the inherited ~18px), so every caption and heading renders tiny and the whole sheet looks "small / minimal / too clean." It looks like a design problem; it is a syntax bug.

**Always write `clamp(1.2rem + 6.6vw, …)` with a space on each side of every `+` and binary `-`.** `check.mjs` flags any that lack them.

## 2. Every `var(--x)` must be defined

A `var(--green)` whose `--green` is never declared resolves to nothing — green bubbles, coral badges, bold words all render transparent or collapsed, again with no error. Keep the full token set from [kit.md](kit.md). `check.mjs` reports used-but-undefined variables (pass every file that defines vars, including HTML/JS that set them inline, so they count as defined).

## 3. Fredoka stops at 700

`font-weight:800` on Fredoka silently falls back to a lighter face. Load and use 500/600/700 only; for heavier presence, size up, don't weight up.

## 4. The page restores old scroll on reload

ScrollTrigger remembers scroll position across reloads, so a reloaded sheet can open halfway down. The scroll-restoration guard in kit.md (manual restoration + `forceTop` + `clearScrollMemory`) fixes it. Verify it: scroll to the bottom, reload, confirm `window.scrollY === 0`.

## 5. Browser-loop flakes (Playwright MCP)

- The window sometimes resets to ~756px wide after a crash — re-assert `browser_resize` to 1440×900 before judging layout.
- "No open pages" — re-navigate to the local URL.
- Screenshots land in the working directory, not the scratchpad — read them from there and `rm -f` after.
- Give the scrub ~1.6–1.7s to settle after seeking before screenshotting, or you capture a mid-tween frame.
- Animate `transform` and `opacity` only. Animating `width`/`height`/`top`/`left` drops frames under scrub.

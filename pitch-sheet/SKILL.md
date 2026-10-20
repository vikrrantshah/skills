---
name: pitch-sheet
description: Build a playful, scroll-scrubbed pitch page with GSAP-pinned scenes, hand-marker captions, and a mascot.
disable-model-invocation: true
---

A **sheet** is a single scrolling web page that tells one persuasive story: a stakeholder scrolls top to bottom for ~3 minutes, each scroll beat is an animation frame, and by the end they get the idea and feel the dopamine. The craft is *scroll-scrubbed* storytelling (the animation is tied to scroll position, never autoplay), a maximal playful look, and a build-then-verify-in-a-real-browser loop so you catch what renders wrong before the user does.

This skill is the end-to-end build process. When available, lean on three sibling skills for the parts they own: `design-taste-frontend` for finding the one idea and avoiding stock layouts, `review-animations` for the motion-craft review gate, and `web-design-guidelines` for general web taste. If those skills are unavailable, choose a subject-specific metaphor, review motion for readability and reduced-motion support, and check responsive layout directly. This skill owns: the sheet's vibe, the reusable component kit, the scroll-scrub mechanics, the deterministic traps, and the verify loop.

## Steps

1. **Find the one idea and the metaphor.** Use `design-taste-frontend` when available to pull the idea from the subject itself, not the category — the sheet lives or dies on this. Then pick ONE physical metaphor that carries the whole story (e.g. problems = flies on a plate; the solution = one swatter that clears them). Mine the real sources for one concrete, credible detail — a real use-case, a real number, a real quote — from user-provided material or available connected sources such as Slack, Granola standups, or Linear. If no source supports a detail, omit it or label it as an assumption. A sheet with a real "this costs us 2–3 days" lands; an abstract one does not. Write the story as an ordered list of claims, one per scene. **Done when** you can say the metaphor in one sentence and list the scenes in order.

2. **Scaffold and copy the kit.** Create `index.html` + `styles.css` + `app.js` in a scratchpad folder and start a local server there (`python3 -m http.server <port> --directory <folder>`, in the background). Copy the tokens, fonts, mascot, window, flies/swatter, marker-caption CSS, phase chips, the scroll-restoration guard and the scrub pattern from [kit.md](kit.md) — these are battle-tested; do not reinvent them. **Done when** the local server serves a page with the palette and fonts live.

3. **Write the words first, big.** Captions are the voice of the sheet. Each is a short sentence wrapped in `<span class="hl">…</span>` so it renders as a **hand-marker highlight**, not a text box (see kit.md). Big, maximal, readable *during* the animation. Use the **phase chips** (`today` / `with X`) as giant colored pills to mark which phase of the story a scene is in. Use the user's requested language; default to English for stakeholder-facing text.

3b. **The look is maximal, not minimal.** Big type, whole fields of colour, speech-bubble energy, playful tilt on the markers. When in doubt, go bigger and bolder, never cleaner and smaller. The mascot is the **pixel-art terracotta Claude** from kit.md (`#c96a4b`), never a logo. The partner app (e.g. Nexus) is a plain software window — "it's just software."

4. **Build each scene as a pinned, scrubbed timeline.** One GSAP timeline per scene, pinned, `scrub: 0.8`, driven by a tall spacer section so the user scrolls *through* the animation (pattern in kit.md). Hold key frames longer so the story is easy to follow. Expose each timeline on `window.__<name>` so the verify loop can seek to any frame. Add the scroll-restoration guard so the page always opens at the very top.

5. **Run the check.** `node <skill>/check.mjs styles.css index.html app.js`. It catches the two silent killers — malformed `clamp()`/`calc()` math and undefined CSS variables — that render as tiny text or invisible elements with no error. Fix every red before looking. See [gotchas.md](gotchas.md) for why these matter and the other traps.

6. **Verify in the browser loop, every scene, at two widths.** This is non-negotiable: you cannot tell if a sheet is right without seeing it. Use available browser automation (for example, Playwright): resize to 1440×900, seek each scene's key frames via the exposed `window.__<name>` globals (seek helper in kit.md), wait ~1.6s for the scrub to settle, screenshot, read the image, fix what is too small / mis-placed / overlapping. Repeat at ~430px wide for phone. **Done when** every scene reads clearly at both widths and nothing is clipped. gotchas.md lists the loop's known flakes and their fixes.

7. **Review the motion.** If available, run the `review-animations` skill against `app.js` and resolve its blocks; otherwise review the timelines directly. A sheet is delightful-but-rare motion, so occasional bounce and scrub are fine; still honor `prefers-reduced-motion` and GPU-only properties.

8. **Publish and report.** When publishing is requested and an authorized publishing tool is available, publish index.html with styles.css and app.js and report the shareable link. Otherwise hand back the local files and preview URL. Report whether opening at the top was verified.

## Autonomy bar

The point of this skill is that the user describes the idea once and you run steps 1–8 without further steering. The two things that historically forced extra rounds — the sheet rendering "too small / too minimal" (always a malformed-clamp or undefined-var bug, caught by step 5) and the look not matching the vibe (caught by building from kit.md and verifying in step 6) — are now mechanical. Do not hand back a sheet you have not seen rendered at both widths.

# The kit

Battle-tested, copy-paste building blocks from a shipped sheet. Copy them as-is; they encode fixes that took rounds to find (see [gotchas.md](gotchas.md)). Everything with a `clamp()` is written with **spaces around every `+`** on purpose — that is load-bearing, not style.

## Tokens (`:root` in styles.css)

```css
:root{
  --paper:#fcf8f0;        /* ground */
  --paper-2:#f6efe0;
  --ink:#2b2720;          /* ink */
  --muted:#6f685c;
  --line-2:#ddd2bf;
  --accent:#2ea36a;       /* the one accent */
  --yellow:#f6c945;       /* a reveal / "swatter" colour */
  --dark:#211e18;         /* a field the big name lands on */
  --cream:#f7f1e3;
  --green:#2ea36a;        /* positive / connection */
  --green-soft:#e4f3ea;
  --coral:#e8705f;        /* failure / "today" */
  --coral-soft:#ffe4df;
  --clay:#c96a4b;         /* terracotta — the Claude mascot's colour */
}
```

Define **every** variable you reference here. `--green`, `--coral`, `--clay`, `--green-soft`, `--coral-soft` were once used but undefined and rendered transparent — check.mjs now catches that.

## Fonts and libraries (in `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap">
```
Display font is **Fredoka** (weights 500/600/700 only — `font-weight:800` silently falls back, so stop at 700). Body font is **Nunito**. Before `</body>`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
```

## Hand-marker captions

The sheet's voice. A caption is a short sentence highlighted like a marker swipe, one colour swipe per line, slightly tilted — never a bordered text box.

```css
.cap .hl{
  font-family:"Fredoka",sans-serif;font-weight:700;
  font-size:clamp(1.85rem,1.3rem + 2.3vw,3.2rem);line-height:1.62;
  color:var(--ink);background:var(--mk);
  -webkit-box-decoration-break:clone;box-decoration-break:clone;
  padding:0.08em 0.32em;border-radius:0.3em;
}
.cap{--mk:#ffdf8a}                 /* neutral / problem = yellow */
.cap.good{--mk:#bfe6cf;transform:rotate(1deg)}    /* positive = green, tilt one way */
.cap:not(.good){transform:rotate(-1.1deg)}        /* tilt the other */
```
```html
<p class="cap"><span class="hl">A single row can't ask the question.</span></p>
```
Wrap the visible text in `<span class="hl">`; the highlight needs `box-decoration-break:clone` to swipe each wrapped line separately.

## Phase chips (giant "today" / "with X" pills)

```css
.phase .disp{
  display:inline-block;font-family:"Fredoka",sans-serif;font-weight:700;
  font-size:clamp(2.6rem,1.6rem + 3.8vw,5rem);letter-spacing:0.005em;line-height:1;
  padding:6px 32px;border-radius:999px;border:4px solid;
}
.phase.today .disp{color:#7a2d26;background:var(--coral-soft);border-color:var(--coral)}
.phase.mcp   .disp{color:#1c6b43;background:var(--green-soft);border-color:var(--green)}
```

## The pixel-art Claude mascot (terracotta — NEVER a logo)

```html
<g id="mascot">
  <g class="px" fill="#c96a4b" shape-rendering="crispEdges">
    <rect x="166" y="170" width="34" height="18"/>
    <rect x="278" y="170" width="34" height="18"/>
    <rect x="150" y="188" width="178" height="74"/>
    <rect x="162" y="262" width="20" height="36"/>
    <rect x="200" y="262" width="20" height="36"/>
    <rect x="258" y="262" width="20" height="36"/>
    <rect x="296" y="262" width="20" height="36"/>
  </g>
  <g id="eyes" class="px" shape-rendering="crispEdges">
    <rect x="192" y="210" width="30" height="30" fill="#1c1a17"/>
    <rect x="266" y="210" width="30" height="30" fill="#1c1a17"/>
  </g>
</g>
```
Two antennae, a body block, four legs, two square eyes. Animate the eyes (`x`) to "look" and bounce `#mascot` with `ease:"bounce.out"`. Set `transformOrigin:"50% 100%"`.

## The partner app as a plain software window

```html
<g>
  <rect x="636" y="196" width="258" height="178" rx="20" fill="#fffdf8" stroke="#2b2720" stroke-width="4"/>
  <line x1="636" y1="236" x2="894" y2="236" stroke="#2b2720" stroke-width="3"/>
  <circle cx="660" cy="216" r="5.5" fill="#2ea36a"/>
  <circle cx="680" cy="216" r="5.5" fill="#ddd2bf"/>
  <circle cx="700" cy="216" r="5.5" fill="#ddd2bf"/>
  <rect x="660" y="258" width="150" height="14" rx="7" fill="#efe7d8"/>
  <rect id="nrow" x="660" y="286" width="196" height="14" rx="7" fill="#efe7d8"/>
  <rect x="660" y="314" width="118" height="14" rx="7" fill="#efe7d8"/>
</g>
```
Light a row (`#nrow` → `fill:var(--green-soft)`) when the app "answers."

## Fly + swatter (metaphor props — tune to taste)

A fly: a dark round body, two white wings, two eyes, a dashed buzz trail. A swatter: a `--yellow` paddle on a handle that swings in with `ease:"power2.in"` and lands with a tiny screen shake. These are the one metaphor that carries the story — make them expressive, not literal.

## Scroll-restoration guard (page always opens at the top)

GSAP ScrollTrigger otherwise restores the previous scroll on reload. Top of your IIFE:
```js
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);
function forceTop() { window.scrollTo(0, 0); }
window.addEventListener("load", forceTop);
window.addEventListener("pageshow", forceTop);
window.addEventListener("beforeunload", function () {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
});
```
End of your IIFE, after all ScrollTriggers are created:
```js
ScrollTrigger.clearScrollMemory("manual");
requestAnimationFrame(function () { window.scrollTo(0, 0); });
```

## A pinned, scrubbed scene

The section is a tall spacer; the stage inside is pinned and the timeline scrubs across the scroll. Expose the timeline for the verify loop.

```css
.p2pin{height:620vh;position:relative;background:var(--paper)}   /* taller = slower / more hold */
.p2-stage{position:relative;height:100svh;overflow:hidden;display:flex;
  flex-direction:column;align-items:center;justify-content:center}
```
```js
var p2 = gsap.timeline({
  scrollTrigger:{ trigger:"#p2", start:"top top", end:"bottom bottom", pin:".p2-stage", scrub:0.8 }
});
p2.to("#p2-a",{opacity:1,y:0,duration:1})
  .to({},{duration:0.6})                 // an empty tween = a HOLD on the key frame
  .to("#p2-a",{opacity:0,duration:0.5});
window.__p2 = p2;                         // the verify loop seeks through this
```
A fast reveal-on-scroll (non-pinned) uses `scrollTrigger:{ trigger: el, start:"top 90%", end:"top 66%", scrub:true }`.

## The verify seek helper

`window.__<name>` holds a **timeline**, not a ScrollTrigger — reach the trigger via `.scrollTrigger`, then scroll to a fraction of its range:
```js
// inside browser_evaluate: jump to 90% through scene p2, then screenshot after ~1.6s settle
() => {
  const st = window.__p2.scrollTrigger;
  const dur = st.end - st.start;
  window.scrollTo({ top: st.start + 0.9 * dur, behavior: "instant" });
  return { start: st.start, end: st.end };
}
```
Wait for the scrub to settle before the screenshot: `() => new Promise(r => setTimeout(() => r("settled"), 1700))`.

#!/usr/bin/env node
// Catches the two silent killers of a pitch sheet:
//   1. clamp()/calc()/min()/max() math with a `+` or binary `-` that lacks surrounding
//      spaces -> invalid value -> silent fallback -> tiny text / wrong sizes.
//   2. var(--x) referenced but never defined -> renders transparent / collapsed.
// Usage:  node check.mjs styles.css index.html app.js
// Pass EVERY file that defines or uses CSS variables (CSS + any HTML/JS that sets them
// inline), so inline-defined vars count as defined. Exit code 1 if anything is flagged.

import { readFileSync } from "node:fs";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node check.mjs <file> [file...]  (css/html/js that define or use CSS vars)");
  process.exit(2);
}

const MATH_FN = /\b(?:clamp|calc|min|max)\s*\(/g;
let problems = 0;
let readErrors = 0;
const defined = new Set();
const used = []; // {name, file, line}
const flagged = new Set(); // dedupe identical hits

for (const file of files) {
  let text;
  try { text = readFileSync(file, "utf8"); }
  catch { console.error(`! cannot read ${file}`); readErrors++; continue; }
  const lineAt = (idx) => text.slice(0, idx).split("\n").length;

  // --- collect variable definitions (`--name:`) and usages (`var(--name`) ---
  for (const m of text.matchAll(/--[\w-]+\s*:/g)) defined.add(m[0].replace(/\s*:$/, ""));
  for (const m of text.matchAll(/var\(\s*(--[\w-]+)/g)) used.push({ name: m[1], file, line: lineAt(m.index) });

  // --- scan inside each math function for unspaced + / binary - ---
  for (const fn of text.matchAll(MATH_FN)) {
    // walk to the matching close paren
    let i = fn.index + fn[0].length, depth = 1;
    while (i < text.length && depth > 0) {
      const c = text[i];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      if (depth === 0) break;
      if (c === "+" || c === "-") {
        const prev = text[i - 1], next = text[i + 1];
        const missingSpace = prev !== " " || next !== " ";
        // nearest non-space char to the left tells value-vs-start
        let j = i - 1; while (j >= 0 && text[j] === " ") j--;
        const prevNS = text[j] || "";
        const valueLeft = /[\w%)\.]/.test(prevNS);
        // `+` is never part of a CSS identifier -> binary when a value is on its left.
        // binary `-` additionally needs a numeric right operand; a letter on the right
        // (e.g. `inset-left`) is an identifier hyphen, not arithmetic.
        const binary = c === "+" ? valueLeft : (valueLeft && /[0-9.]/.test(next || ""));
        const key = `${file}:${lineAt(i)}:${i}`;
        if (binary && missingSpace && !flagged.has(key)) {
          flagged.add(key);
          console.log(`✗ ${file}:${lineAt(i)}  '${c}' without surrounding spaces inside ${fn[0].slice(0, -1)}()  -> invalid, silent fallback`);
          problems++;
        }
      }
      i++;
    }
  }
}

// --- report used-but-undefined vars ---
const seen = new Set();
for (const u of used) {
  if (!defined.has(u.name) && !seen.has(u.name + u.file + u.line)) {
    seen.add(u.name + u.file + u.line);
    console.log(`✗ ${u.file}:${u.line}  var(${u.name}) is never defined  -> renders transparent/collapsed`);
    problems++;
  }
}

if (problems === 0 && readErrors === 0) console.log("✓ no clamp-spacing or undefined-variable problems");
else if (problems > 0) console.log(`\n${problems} problem(s) — fix before judging the render.`);
process.exit(readErrors > 0 ? 2 : problems > 0 ? 1 : 0);

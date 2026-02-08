/**
 * Single-pass HTML-to-Markdown converter.
 *
 * Each element type is handled by a pure function that returns
 * a markdown string and a spacing hint. The parent joins children
 * with appropriate newline spacing. No intermediate representation,
 * no buffer accumulator, no registry lookup.
 */

import { type Element, type Node, NodeType } from "@b-fuze/deno-dom";
import type { MdOptions } from "./config.ts";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Convert a parsed DOM body to markdown. */
export function convert(root: Element, opts: MdOptions): string {
  const refs: string[] = [];
  const md = visitChildren(root, opts, {
    raw: false,
    literalWs: false,
    depth: 0,
  }, refs);
  return finish(md, opts, refs);
}

// ---------------------------------------------------------------------------
// Context — plain object, not an immutable Scope class
// ---------------------------------------------------------------------------

interface Ctx {
  raw: boolean;
  literalWs: boolean;
  depth: number; // list nesting depth
}

// ---------------------------------------------------------------------------
// Result type: [markdown text, spacing level]
//   spacing 0 = inline, 1 = single newline, 2 = double newline (block)
// ---------------------------------------------------------------------------

type Result = [string, number] | null;

// ---------------------------------------------------------------------------
// Children visitor — joins child results with proper spacing
// ---------------------------------------------------------------------------

function visitChildren(
  parent: Element,
  opts: MdOptions,
  ctx: Ctx,
  refs: string[],
): string {
  let out = "";
  let prevSp = 0;

  for (const child of parent.childNodes) {
    let text: string | null = null;
    let sp = 0;
    let isText = false;

    if (child.nodeType === NodeType.TEXT_NODE) {
      text = processText(child.textContent ?? "", opts, ctx);
      isText = true;
    } else if (child.nodeType === NodeType.ELEMENT_NODE) {
      const r = visitElement(child as unknown as Element, opts, ctx, refs);
      if (r) {
        text = r[0];
        sp = r[1];
      }
    }

    if (text == null || text === "") continue;

    // Whitespace-only text nodes: collapse to single space
    if (isText && /^\s+$/.test(text)) {
      if (!out || /\s$/.test(out)) continue;
      out += " ";
      prevSp = 0;
      continue;
    }

    // Insert newlines at block boundaries
    const gap = Math.max(sp, prevSp);
    if (gap > 0 && out) {
      out = padTrailingNl(out, gap);
    }

    // Prevent delimiter collision (e.g. **a****b** → **a** **b**)
    if (gap === 0 && out) {
      const lc = out[out.length - 1];
      const fc = text[0];
      if (lc === fc && "*_~`".includes(lc)) {
        out += " ";
      }
    }

    out += text;
    prevSp = sp;
  }

  // Trailing newlines after last block child
  if (prevSp > 0 && out) {
    out = padTrailingNl(out, prevSp);
  }

  return out;
}

// ---------------------------------------------------------------------------
// Element dispatch — direct if/else, no registry
// ---------------------------------------------------------------------------

function visitElement(
  el: Element,
  opts: MdOptions,
  ctx: Ctx,
  refs: string[],
): Result {
  const tag = el.tagName;

  // Skip non-content elements and user-ignored tags
  if (shouldSkip(tag) || opts.skipTags.some((t) => t.toUpperCase() === tag)) {
    return null;
  }

  // --- Void / self-closing ---

  if (tag === "BR") return ["  \n", 0];
  if (tag === "HR") return ["---", 2];
  if (tag === "IMG") return imgToMd(el, opts);

  // --- Headings ---

  if (tag[0] === "H" && tag.length === 2 && tag[1] >= "1" && tag[1] <= "6") {
    const c = visitChildren(el, opts, ctx, refs);
    if (blank(c)) return null;
    return ["#".repeat(+tag[1]) + " " + c.trim(), 2];
  }

  // --- Inline formatting ---

  if (tag === "STRONG" || tag === "B") {
    return inlineMarkToMd(el, opts.strongMark, opts, ctx, refs);
  }
  if (tag === "EM" || tag === "I") {
    return inlineMarkToMd(el, opts.emphasisMark, opts, ctx, refs);
  }
  if (tag === "DEL" || tag === "S" || tag === "STRIKE") {
    return inlineMarkToMd(el, opts.strikeMark, opts, ctx, refs);
  }

  // --- Code ---

  if (tag === "CODE" && el.parentElement?.tagName !== "PRE") {
    return inlineCodeToMd(el);
  }
  if (tag === "PRE") return preToMd(el, opts, ctx, refs);

  // --- Links ---

  if (tag === "A") return linkToMd(el, opts, ctx, refs);

  // --- Structure ---

  if (tag === "OL" || tag === "UL") return listToMd(el, opts, ctx, refs);
  if (tag === "BLOCKQUOTE") return bqToMd(el, opts, ctx, refs);
  if (tag === "TABLE") return tableToMd(el, opts, ctx, refs);

  // Table sub-elements orphaned outside <table> — just emit children
  if (
    tag === "THEAD" || tag === "TBODY" || tag === "TFOOT" ||
    tag === "TR" || tag === "TD" || tag === "TH" || tag === "CAPTION"
  ) {
    const c = visitChildren(el, opts, ctx, refs);
    return c ? [c, 0] : null;
  }

  // --- Fallback: classify remaining tags ---
  // Phrasing (inline) content → no spacing; everything else → block spacing.
  // This defaults unknown/custom elements to block, which is the safer choice.

  const c = visitChildren(el, opts, ctx, refs);

  if (
    isPhrasing(tag) &&
    !opts.extraBlockTags.some((t) => t.toUpperCase() === tag)
  ) {
    return c ? [c, 0] : null;
  }

  if (blank(c)) return null;
  return [c, 2];
}

// ---------------------------------------------------------------------------
// Element-specific handlers (pure functions → string)
// ---------------------------------------------------------------------------

function inlineMarkToMd(
  el: Element,
  mark: string,
  opts: MdOptions,
  ctx: Ctx,
  refs: string[],
): Result {
  const c = visitChildren(el, opts, ctx, refs);
  if (blank(c)) return null;
  return [wrapMark(c, mark), 0];
}

function inlineCodeToMd(el: Element): Result {
  const text = plainText(el);
  if (!text) return null;
  let maxRun = 0;
  for (const m of text.matchAll(/`+/g)) {
    if (m[0].length > maxRun) maxRun = m[0].length;
  }
  const fence = "`".repeat(maxRun + 1);
  const pad = fence.length > 1 ? " " : "";
  return [fence + pad + text + pad + fence, 0];
}

function preToMd(
  el: Element,
  opts: MdOptions,
  ctx: Ctx,
  refs: string[],
): Result {
  const code = firstChildByTag(el, "CODE");
  if (code) {
    const lang = langFromClass(code);
    const body = codeBlockText(code);
    if (opts.codeBlockStyle === "indented") {
      return [body.replace(/^/gm, "    "), 2];
    }
    return [opts.codeFence + lang + "\n" + body + "\n" + opts.codeFence, 2];
  }
  // Bare <pre> without <code> — fence or indent like <pre><code>
  const rawCtx: Ctx = { ...ctx, raw: true, literalWs: true };
  const body = visitChildren(el, opts, rawCtx, refs);
  if (opts.codeBlockStyle === "indented") {
    return [body.replace(/^/gm, "    "), 2];
  }
  const lang = langFromClass(el);
  return [opts.codeFence + lang + "\n" + body + "\n" + opts.codeFence, 2];
}

function linkToMd(
  el: Element,
  opts: MdOptions,
  ctx: Ctx,
  refs: string[],
): Result {
  const href = el.getAttribute("href");
  if (!href) {
    const c = visitChildren(el, opts, ctx, refs);
    return c ? [c, 0] : null;
  }
  const encoded = encodeHref(href);
  const title = el.getAttribute("title") || "";
  const c = visitChildren(el, opts, ctx, refs);
  const text = c.replace(/(?:\r?\n)+/g, " ").trim();

  if (opts.autolinks && (text === href || text === encoded)) {
    return [`<${encoded}>`, 0];
  }
  if (opts.refLinks) {
    const idx = trackRef(refs, encoded);
    return [`[${text}][${idx}]`, 0];
  }
  const tp = title ? ` "${title}"` : "";
  return [`[${text}](${encoded}${tp})`, 0];
}

function imgToMd(el: Element, opts: MdOptions): Result {
  const src = el.getAttribute("src") || "";
  if (!src) return null;
  if (/^data:/i.test(src) && !opts.keepDataImages) return null;
  const alt = el.getAttribute("alt") || "";
  const title = el.getAttribute("title") || "";
  const tp = title ? ` "${title}"` : "";
  return [`![${alt}](${src}${tp})`, 0];
}

function listToMd(
  el: Element,
  opts: MdOptions,
  ctx: Ctx,
  refs: string[],
): Result {
  const ordered = el.tagName === "OL";
  const indent = opts.indent.repeat(ctx.depth);
  const childCtx: Ctx = { ...ctx, depth: ctx.depth + 1 };
  const items: string[] = [];

  for (const child of el.childNodes) {
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const li = child as unknown as Element;
    if (li.tagName !== "LI") continue;

    const c = visitChildren(li, opts, childCtx, refs);
    if (blank(c)) continue;

    const idx = items.length;
    const marker = ordered ? `${idx + 1}. ` : `${opts.bulletMarker} `;
    let body = c.replace(/^\n+|\n+$/g, "");

    // Indent continuation lines (but not nested list markers or table pipes)
    const contIndent = indent + " ".repeat(marker.length);
    body = body.replace(
      /(?<=.)(?:\r?\n)+(?!\s*[-*+][ \t]|\s*\d+\.[ \t]|\s*\|)/g,
      "  \n" + contIndent,
    );
    body = body.replace(/(?<=\S)[ \t]+$/gm, "  ");

    items.push(indent + marker + body);
  }

  if (items.length === 0) return null;
  const sp = ctx.depth > 0 ? 1 : 2;
  return [items.join("\n"), sp];
}

function bqToMd(
  el: Element,
  opts: MdOptions,
  ctx: Ctx,
  refs: string[],
): Result {
  const c = visitChildren(el, opts, ctx, refs);
  if (blank(c)) return null;
  const trimmed = c.replace(/^\n+|\n+$/g, "");
  const quoted = trimmed.replace(/^(>*)[ \t]?/gm, ">$1 ");
  return [quoted, 2];
}

function tableToMd(
  el: Element,
  opts: MdOptions,
  ctx: Ctx,
  refs: string[],
): Result {
  let caption = "";
  const rows: string[][] = [];
  const widths: number[] = [];

  gatherRows(el, opts, ctx, refs, rows, widths, (t) => {
    caption = "__" + t + "__";
  });

  // Remove fully empty rows
  const filtered = rows.filter((r) => r.some((c) => c.length > 0));
  if (filtered.length === 0) return null;

  const lines: string[] = [];
  for (let r = 0; r < filtered.length; r++) {
    const row = filtered[r];
    let line = "|";
    for (let c = 0; c < widths.length; c++) {
      const cell = c < row.length ? row[c] : "";
      line += " " + cell.padEnd(widths[c]) + " |";
    }
    lines.push(line);
    if (r === 0) {
      let sep = "|";
      for (let c = 0; c < widths.length; c++) {
        sep += " " + "-".repeat(widths[c]) + " |";
      }
      lines.push(sep);
    }
  }

  const text = (caption ? caption + "\n" : "") + lines.join("\n");
  return [text, 2];
}

function gatherRows(
  el: Element,
  opts: MdOptions,
  ctx: Ctx,
  refs: string[],
  rows: string[][],
  widths: number[],
  onCaption: (t: string) => void,
): void {
  for (const child of el.childNodes) {
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const ch = child as unknown as Element;
    const tag = ch.tagName;

    if (tag === "CAPTION") {
      const t = plainText(ch).trim();
      if (t) onCaption(t);
      continue;
    }
    if (tag === "THEAD" || tag === "TBODY" || tag === "TFOOT") {
      gatherRows(ch, opts, ctx, refs, rows, widths, onCaption);
      continue;
    }
    if (tag === "TR") {
      const cells: string[] = [];
      for (const cn of ch.childNodes) {
        if (cn.nodeType !== NodeType.ELEMENT_NODE) continue;
        const ce = cn as unknown as Element;
        if (ce.tagName !== "TD" && ce.tagName !== "TH") continue;
        let text = visitChildren(ce, opts, ctx, refs);
        text = text.replace(/^\n+|\n+$/g, "");
        text = text.replace(/\|/g, "\\|");
        text = text.replace(/(?:\r?\n)+/g, " ");
        text = text.trim();
        cells.push(text);
        const i = cells.length - 1;
        if (i >= widths.length) widths.push(text.length);
        else if (text.length > widths[i]) widths[i] = text.length;
      }
      if (cells.length > 0) rows.push(cells);
    }
  }
}

// ---------------------------------------------------------------------------
// Text processing
// ---------------------------------------------------------------------------

function processText(raw: string, opts: MdOptions, ctx: Ctx): string | null {
  let s = raw;
  if (!s) return null;

  if (!ctx.literalWs) {
    s = s.replace(/\s+/g, " ");
  }

  if (!ctx.raw) {
    s = s.replace(opts.charEscape[0], opts.charEscape[1]);
    for (const [pat, rep] of opts.lineLeadEscape) {
      s = s.replace(pat, rep);
    }
  }

  for (const [pat, rep] of opts.textReplacements) {
    s = s.replace(pat, rep);
  }

  // Trim leading whitespace from newline-starting text
  if (/^\n/.test(raw) && !ctx.literalWs) {
    s = s.replace(/^\s+/, " ");
  }

  // Trim trailing whitespace if raw didn't end with spaces
  if (!/\s$/.test(raw) && !ctx.literalWs) {
    s = s.replace(/\s+$/, "");
  }

  return s || null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function blank(s: string): boolean {
  return !/\S/.test(s);
}

/** Ensure at least `n` trailing newlines on a string. */
function padTrailingNl(s: string, n: number): string {
  let trail = 0;
  for (let i = s.length - 1; i >= 0 && s[i] === "\n"; i--) trail++;
  if (trail >= n) return s;
  return s + "\n".repeat(n - trail);
}

/** Extract plain text from a DOM subtree (no formatting). */
function plainText(el: Element): string {
  let out = "";
  for (const ch of el.childNodes) {
    if (ch.nodeType === NodeType.TEXT_NODE) out += ch.textContent ?? "";
    else if (ch.nodeType === NodeType.ELEMENT_NODE) {
      out += plainText(ch as unknown as Element);
    }
  }
  return out;
}

/**
 * Extract text from a code block element.
 * Applies code-block child rules: br→\n, heading→[text], img→skip,
 * block elements produce no extra spacing.
 */
function codeBlockText(el: Element): string {
  const parts: string[] = [];
  walkCode(el, parts);
  return parts.join("");
}

function walkCode(node: Node, parts: string[]): void {
  if (node.nodeType === NodeType.TEXT_NODE) {
    parts.push(node.textContent ?? "");
    return;
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) return;
  const el = node as unknown as Element;
  const tag = el.tagName;

  if (tag === "BR") {
    parts.push("\n");
    return;
  }
  if (tag === "HR") {
    parts.push("---");
    return;
  }
  if (tag === "IMG") return;
  if (tag[0] === "H" && tag.length === 2 && tag[1] >= "1" && tag[1] <= "6") {
    parts.push("[");
    for (const ch of el.childNodes) walkCode(ch as Node, parts);
    parts.push("]");
    return;
  }
  for (const ch of el.childNodes) walkCode(ch as Node, parts);
}

function langFromClass(code: Element): string {
  const cls = code.getAttribute("class") || "";
  const m = cls.match(/(?:language|lang)-(\S+)/);
  return m ? m[1] : "";
}

function firstChildByTag(el: Element, tag: string): Element | null {
  for (const ch of el.childNodes) {
    if (
      ch.nodeType === NodeType.ELEMENT_NODE &&
      (ch as unknown as Element).tagName === tag
    ) {
      return ch as unknown as Element;
    }
  }
  return null;
}

/** Wrap content with an inline delimiter, moving whitespace outside. */
function wrapMark(content: string, mark: string): string {
  if (!content) return "";

  const leadM = content.match(/^(\s+)/);
  const trailM = content.match(/(\s+)$/);
  const lead = leadM ? leadM[1] : "";
  const trail = trailM ? trailM[1] : "";
  let inner = content.slice(lead.length, content.length - trail.length);

  if (!inner) return content;

  // Strip nested unescaped occurrences of the same delimiter
  const esc = mark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  inner = inner.replace(new RegExp(`(?<!\\\\)${esc}`, "g"), "");

  if (!inner || blank(inner)) return lead + trail;

  // Multiline: wrap each non-blank line separately
  if (/\r?\n/.test(inner)) {
    const segs = inner.split(/(\r?\n)/);
    const res: string[] = [];
    for (const seg of segs) {
      if (/^\r?\n$/.test(seg)) {
        res.push(seg);
      } else if (seg && !blank(seg)) {
        const ll = seg.match(/^(\s+)/);
        const tl = seg.match(/(\s+)$/);
        const lp = ll ? ll[1] : "";
        const tp = tl ? tl[1] : "";
        const mid = seg.slice(lp.length, seg.length - tp.length);
        res.push(mid ? lp + mark + mid + mark + tp : seg);
      } else {
        res.push(seg);
      }
    }
    return lead + res.join("") + trail;
  }

  return lead + mark + inner + mark + trail;
}

function encodeHref(href: string): string {
  return href
    .replace(/%28/gi, "(")
    .replace(/%29/gi, ")")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/_/g, "%5F")
    .replace(/\*/g, "%2A");
}

function trackRef(refs: string[], url: string): number {
  const i = refs.indexOf(url);
  if (i >= 0) return i + 1;
  refs.push(url);
  return refs.length;
}

/** Finalize: append reference links, apply maxBlankLines, trim. */
function finish(text: string, opts: MdOptions, refs: string[]): string {
  let r = text;

  if (refs.length > 0) {
    r += "\n\n";
    for (let i = 0; i < refs.length; i++) {
      r += `[${i + 1}]: ${refs[i]}\n`;
    }
  }

  if (opts.maxBlankLines > 0) {
    const n = opts.maxBlankLines;
    r = r.replace(
      new RegExp(`(?:[ \\t]*\\n){${n + 1},}`, "g"),
      "\n".repeat(n),
    );
  }

  return r.trim();
}

// ---------------------------------------------------------------------------
// Tag classification
// ---------------------------------------------------------------------------

/**
 * Elements whose children should never be emitted.
 *
 * Only tags that contain non-content text (JS, CSS, hidden markup) need
 * explicit skipping. Void/empty elements (META, INPUT, WBR, etc.) are not
 * listed because they have no children — recursing into them naturally
 * produces nothing.
 */
function shouldSkip(tag: string): boolean {
  switch (tag) {
    case "SCRIPT":
    case "STYLE":
    case "HEAD":
    case "TEMPLATE":
    case "NOSCRIPT":
      return true;
    default:
      return false;
  }
}

/**
 * Phrasing content — the HTML spec's term for inline-level elements.
 * https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
 *
 * Only lists tags that aren't already handled by explicit cases in
 * visitElement (B, EM, STRONG, I, DEL, S, STRIKE, CODE, A, IMG, BR).
 * Any tag NOT here and NOT explicitly handled defaults to block spacing,
 * which is the safe choice for unknown or custom elements.
 */
function isPhrasing(tag: string): boolean {
  switch (tag) {
    case "ABBR":
    case "BDI":
    case "BDO":
    case "BUTTON":
    case "CITE":
    case "DATA":
    case "DFN":
    case "IFRAME":
    case "INS":
    case "KBD":
    case "LABEL":
    case "MAP":
    case "MARK":
    case "MATH":
    case "METER":
    case "OBJECT":
    case "OUTPUT":
    case "PICTURE":
    case "PROGRESS":
    case "Q":
    case "RUBY":
    case "RP":
    case "RT":
    case "SAMP":
    case "SELECT":
    case "SMALL":
    case "SPAN":
    case "SUB":
    case "SUP":
    case "SVG":
    case "TEXTAREA":
    case "TIME":
    case "U":
    case "VAR":
    case "VIDEO":
      return true;
    default:
      return false;
  }
}

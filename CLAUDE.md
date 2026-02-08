# CLAUDE.md

## What is this

**@codybrom/html2md** converts HTML to Markdown. Deno, JSR, uses `deno-dom` for
parsing.

## Commands

```bash
deno test                    # Run all tests
deno check mod.ts            # Type-check
deno lint                    # Lint
deno fmt                     # Format
deno fmt --check             # Check formatting
```

Run `deno install` after cloning.

## How it works

Three files in `src/`, one job each:

**parse.ts** — `parseHtml(html)` gives you a DOM tree via deno-dom. That's it.

**config.ts** — `MdOptions` interface and `DEFAULT_OPTIONS`. Config only, no
logic, no element lists.

**convert.ts** — Where everything happens. `convert(root, opts)` walks the DOM
in one pass and returns a markdown string. The walk works like this:

`visitElement()` checks the tag name with a straight if/else chain. Known tags
like `H1`, `A`, `TABLE`, `PRE` etc. have dedicated handler functions
(`linkToMd`, `tableToMd`, `preToMd`, ...) that each return a `[text, spacing]`
tuple — the markdown fragment and how much vertical space it needs (0 = inline,
2 = block). `visitChildren()` joins these tuples together, inserting newlines at
block boundaries via `padTrailingNl()`.

Tags that don't have explicit handlers hit the fallback at the bottom of
`visitElement()`. Two small switch/case functions classify them:

`shouldSkip(tag)` catches the 5 tags whose children would leak junk into the
output (SCRIPT, STYLE, HEAD, TEMPLATE, NOSCRIPT). Void elements like META and
INPUT aren't here — they have no children, so they naturally produce nothing.

`isPhrasing(tag)` identifies inline elements (SPAN, ABBR, KBD, etc.). Anything
not recognized defaults to block spacing, which is the safer assumption for
unknown or custom elements.

Context (`{ raw, literalWs, depth }`) threads through as a plain object. `raw`
skips escaping (used inside `<pre>`), `literalWs` preserves whitespace, `depth`
tracks list nesting.

## Tests

108 tests in `tests/`, organized by feature: `inline_test.ts`, `block_test.ts`,
`link_test.ts`, `list_test.ts`, `table_test.ts`, `codeblock_test.ts`,
`options_test.ts`, `edge_cases_test.ts`. All imports go through `mod.ts` so
internal refactors don't touch tests.

## Gotchas

Whitespace-only text nodes get collapsed to a single space, but element results
like BR (`"  \n"`) must not — the visitor tracks an `isText` flag to distinguish
them.

Empty table cells produce `|  |` (no dashes in separator) because
`"-".repeat(0)` is `""`. This is intentional.

`wrapMark()` handles delimiter wrapping for bold/italic/strike. It moves
whitespace outside the delimiters, strips nested duplicates, and wraps each
non-blank line separately for multiline content.

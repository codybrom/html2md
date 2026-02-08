# @codybrom/html2md

HTML-to-Markdown converter for Deno. Published on JSR, uses `deno-dom` for
parsing.

## Commands

```bash
deno test             # Run all tests
deno check mod.ts     # Type-check
deno lint             # Lint
deno fmt              # Format
deno fmt --check      # Check formatting
```

Run `deno install` after cloning.

## Architecture

Three files in `src/`, one job each:

- **parse.ts** — `parseHtml(html)` wraps deno-dom to produce a DOM tree.
- **config.ts** — `MdOptions` interface and `DEFAULT_OPTIONS`. Config only.
- **convert.ts** — `convert(root, opts)` walks the DOM in one pass, returns
  markdown.

### Conversion walkthrough

`visitElement()` matches tag names via if/else. Known tags (H1, A, TABLE, PRE,
etc.) dispatch to dedicated handlers (`linkToMd`, `tableToMd`, `preToMd`, ...)
that return `[text, spacing]` tuples — the markdown fragment and its vertical
spacing (0 = inline, 2 = block). `visitChildren()` joins tuples, inserting
newlines at block boundaries via `padTrailingNl()`.

Unhandled tags hit the fallback, classified by two switch/case functions:

- `shouldSkip(tag)` — 5 tags whose children would leak junk (SCRIPT, STYLE,
  HEAD, TEMPLATE, NOSCRIPT). Void elements (META, INPUT) aren't listed — no
  children means no output.
- `isPhrasing(tag)` — inline elements (SPAN, ABBR, KBD, etc.). Unknown tags
  default to block spacing.

Context (`{ raw, literalWs, depth }`) threads through as a plain object: `raw`
skips escaping (inside `<pre>`), `literalWs` preserves whitespace, `depth`
tracks list nesting.

## Tests

112 tests in `tests/`, organized by feature (`inline_test.ts`, `block_test.ts`,
`link_test.ts`, `list_test.ts`, `table_test.ts`, `codeblock_test.ts`,
`options_test.ts`, `edge_cases_test.ts`). All imports go through `mod.ts` so
internal refactors don't touch tests.

## Changelog

Every user-visible change must be documented in `CHANGELOG.md`. Use an
`## Unreleased` section at the top for changes not yet tagged to a release. When
bumping the version, rename `Unreleased` to the new version number. Follow
semver: **patch** for bug fixes, **minor** for new features, **major** for
breaking changes.

## Gotchas

- Whitespace-only text nodes collapse to a single space, but element results
  like BR (`"  \n"`) must not — the visitor uses an `isText` flag to distinguish
  them.
- Empty table cells produce `|  |` (no dashes in separator) because
  `"-".repeat(0)` is `""`. Intentional.
- `wrapMark()` handles bold/italic/strike delimiters: moves whitespace outside
  delimiters, strips nested duplicates, wraps each non-blank line separately for
  multiline content.

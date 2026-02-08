# Changelog

## 1.0.2

### Fixed

- Bare `<pre>` tags (without a `<code>` child) now produce fenced code blocks
  when `codeBlockStyle` is `"fenced"` (the default). Previously they fell
  through to plain text output. Language hints are extracted from the `<pre>`
  element's `class` attribute (e.g. `class="lang-json"` or
  `class="prettyprint lang-json"`).

## 1.0.1

### Changed

- Republished to JSR with provenance attestation.
- Cleaned up repo config files.

## 1.0.0

### Added

- `htmlToMd(html, options?)` — single-call HTML-to-Markdown conversion.
- `batchHtmlToMd(files, options?)` — convert a record of HTML strings at once.
- `MdEngine` class — reusable converter with frozen options.
- Full support for headings, paragraphs, blockquotes, horizontal rules, line
  breaks, bold, italic, strikethrough, inline code, links, images, ordered and
  unordered lists (with nesting), tables, and fenced/indented code blocks.
- Configurable options: `codeFence`, `bulletMarker`, `indent`, `codeBlockStyle`,
  `emphasisMark`, `strongMark`, `strikeMark`, `maxBlankLines`, `skipTags`,
  `extraBlockTags`, `charEscape`, `lineLeadEscape`, `textReplacements`,
  `keepDataImages`, `refLinks`, `autolinks`.
- MIT license.

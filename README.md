# @codybrom/html2md

Fast HTML-to-Markdown converter for Deno. Single function call, no config
required, handles the stuff you'd expect (tables, code blocks, nested lists,
reference links, etc.).

## Install

```ts
import { htmlToMd } from "jsr:@codybrom/html2md";
```

Or in your `deno.json`:

```json
{
  "imports": {
    "@codybrom/html2md": "jsr:@codybrom/html2md"
  }
}
```

## Quick start

```ts
import { htmlToMd } from "@codybrom/html2md";

htmlToMd("<h1>Hello</h1><p>World</p>");
// # Hello
//
// World
```

That's the whole API for most use cases. Pass HTML in, get markdown out.

## Batch conversion

If you've got multiple files, `batchHtmlToMd` takes a record and returns one:

```ts
import { batchHtmlToMd } from "@codybrom/html2md";

const results = batchHtmlToMd({
  "page1.html": "<b>hello</b>",
  "page2.html": "<em>goodbye</em>",
});
// { "page1.html": "**hello**", "page2.html": "_goodbye_" }
```

For repeated conversions with the same config, `MdEngine` freezes options once
and reuses them:

```ts
import { MdEngine } from "@codybrom/html2md";

const engine = new MdEngine({ bulletMarker: "-" });
engine.convert("<ul><li>one</li><li>two</li></ul>");
```

## Options

Everything's optional. Defaults are sensible.

````ts
htmlToMd(html, {
  codeFence: "```", // code block delimiter
  bulletMarker: "*", // unordered list marker (* - +)
  codeBlockStyle: "fenced", // "fenced" or "indented"
  emphasisMark: "_", // italic delimiter
  strongMark: "**", // bold delimiter
  strikeMark: "~~", // strikethrough delimiter
  indent: "  ", // list nesting indent

  maxBlankLines: 3, // collapse runs of blank lines
  keepDataImages: false, // include data: URI images
  refLinks: false, // [text][1] style instead of inline
  autolinks: true, // <url> when link text matches href

  skipTags: [], // tags to ignore completely
  extraBlockTags: [], // treat these as block-level
  charEscape: [/[\\`*_~\[\]]/gm, "\\$&"],
  lineLeadEscape: [/pattern/gm, "replacement"],
  textReplacements: [], // [[/find/g, "replace"], ...]
});
````

## License

MIT

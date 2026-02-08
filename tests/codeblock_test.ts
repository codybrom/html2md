import { assertEquals } from "@std/assert";
import { htmlToMd } from "../mod.ts";

Deno.test("fenced code block - basic", () => {
  assertEquals(
    htmlToMd("<pre><code>code here</code></pre>"),
    "```\ncode here\n```",
  );
});

Deno.test("fenced code block - with language", () => {
  assertEquals(
    htmlToMd('<pre><code class="language-js">let x = 1;</code></pre>'),
    "```js\nlet x = 1;\n```",
  );
});

Deno.test("fenced code block - custom fence", () => {
  assertEquals(
    htmlToMd("<pre><code>code</code></pre>", { codeFence: "+++" }),
    "+++\ncode\n+++",
  );
});

Deno.test("indented code block", () => {
  assertEquals(
    htmlToMd("text<pre><code>code</code></pre>text", {
      codeBlockStyle: "indented",
    }),
    "text\n\n    code\n\ntext",
  );
});

Deno.test("code block - br becomes newline", () => {
  assertEquals(htmlToMd("<pre><code>a<br>b</code></pre>"), "```\na\nb\n```");
});

Deno.test("code block - headings become brackets", () => {
  assertEquals(
    htmlToMd("<pre><code><h1>title</h1></code></pre>"),
    "```\n[title]\n```",
  );
});

Deno.test("code block - images removed", () => {
  assertEquals(
    htmlToMd('<pre><code><img src="url">text</code></pre>'),
    "```\ntext\n```",
  );
});

Deno.test("code block - no formatting", () => {
  assertEquals(
    htmlToMd("<pre><code><b>bold</b> <em>italic</em></code></pre>"),
    "```\nbold italic\n```",
  );
});

Deno.test("code block - block elements no extra newlines", () => {
  assertEquals(
    htmlToMd("<pre><code><div>a</div><div>b</div></code></pre>"),
    "```\nab\n```",
  );
});

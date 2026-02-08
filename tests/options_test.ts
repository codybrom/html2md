import { assertEquals } from "@std/assert";
import { htmlToMd } from "../mod.ts";

Deno.test("option: bulletMarker", () => {
  assertEquals(
    htmlToMd("<ul><li>item</li></ul>", { bulletMarker: "-" }),
    "- item",
  );
});

Deno.test("option: emphasisMark", () => {
  assertEquals(htmlToMd("<em>text</em>", { emphasisMark: "*" }), "*text*");
});

Deno.test("option: strongMark", () => {
  assertEquals(htmlToMd("<b>text</b>", { strongMark: "__" }), "__text__");
});

Deno.test("option: strikeMark", () => {
  assertEquals(htmlToMd("<del>text</del>", { strikeMark: "~" }), "~text~");
});

Deno.test("option: codeFence", () => {
  assertEquals(
    htmlToMd("<pre><code>code</code></pre>", { codeFence: "+++" }),
    "+++\ncode\n+++",
  );
});

Deno.test("option: codeBlockStyle indented", () => {
  assertEquals(
    htmlToMd("text<pre><code>code</code></pre>text", {
      codeBlockStyle: "indented",
    }),
    "text\n\n    code\n\ntext",
  );
});

Deno.test("option: skipTags", () => {
  assertEquals(
    htmlToMd("before<nav>nav content</nav>after", { skipTags: ["NAV"] }),
    "beforeafter",
  );
});

Deno.test("option: extraBlockTags", () => {
  const result = htmlToMd("a<span>block</span>b", {
    extraBlockTags: ["SPAN"],
  });
  assertEquals(result, "a\n\nblock\n\nb");
});

Deno.test("option: maxBlankLines", () => {
  // 10 br tags produce many lines — maxBlankLines should cap consecutive blank lines
  const html = "a" + "<br>".repeat(10) + "b";
  const result = htmlToMd(html, { maxBlankLines: 3 });
  // Count newlines — should be at most 3
  const nlCount = result.match(/\n/g)?.length ?? 0;
  assertEquals(nlCount <= 3, true);
});

Deno.test("option: charEscape", () => {
  // Disable char escaping
  assertEquals(
    htmlToMd("<p>*text*</p>", { charEscape: [/(?:)/g, ""] }),
    "*text*",
  );
});

Deno.test("option: lineLeadEscape", () => {
  // With default escaping, + at line start is escaped
  const result = htmlToMd("<p>+ bullet</p>");
  assertEquals(result.includes("\\+"), true);
});

Deno.test("option: textReplacements", () => {
  assertEquals(
    htmlToMd("<p>abc def</p>", { textReplacements: [[/abc/g, "xyz"]] }),
    "xyz def",
  );
});

Deno.test("option: keepDataImages true", () => {
  assertEquals(
    htmlToMd('<img src="data:image/png;base64,abc" alt="test">', {
      keepDataImages: true,
    }),
    "![test](data:image/png;base64,abc)",
  );
});

Deno.test("option: refLinks", () => {
  assertEquals(
    htmlToMd('<a href="url">text</a>', { refLinks: true }),
    "[text][1]\n\n[1]: url",
  );
});

Deno.test("option: autolinks", () => {
  assertEquals(
    htmlToMd('<a href="http://example.com">http://example.com</a>', {
      autolinks: true,
    }),
    "<http://example.com>",
  );
});

Deno.test("option: indent", () => {
  assertEquals(
    htmlToMd("<ul><li>a<ul><li>b</li></ul></li></ul>", { indent: "    " }),
    "* a\n    * b",
  );
});

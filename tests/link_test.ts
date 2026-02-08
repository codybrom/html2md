import { assertEquals } from "@std/assert";
import { htmlToMd } from "../mod.ts";

Deno.test("link - basic", () => {
  assertEquals(htmlToMd('<a href="url">text</a>'), "[text](url)");
});

Deno.test("link - no href", () => {
  assertEquals(htmlToMd("<a>text</a>"), "text");
});

Deno.test("link - with title", () => {
  assertEquals(
    htmlToMd('<a href="url" title="title">text</a>'),
    '[text](url "title")',
  );
});

Deno.test("link - autolink when text matches href", () => {
  assertEquals(
    htmlToMd('<a href="http://example.com">http://example.com</a>'),
    "<http://example.com>",
  );
});

Deno.test("link - autolinks disabled", () => {
  assertEquals(
    htmlToMd('<a href="http://example.com">http://example.com</a>', {
      autolinks: false,
    }),
    "[http://example.com](http://example.com)",
  );
});

Deno.test("link - URL encoding special chars", () => {
  assertEquals(
    htmlToMd('<a href="url_(with)_parens">text</a>'),
    "[text](url%5F%28with%29%5Fparens)",
  );
});

Deno.test("link - URL encoding asterisks", () => {
  assertEquals(
    htmlToMd('<a href="url*bold*">text</a>'),
    "[text](url%2Abold%2A)",
  );
});

Deno.test("link - reference definitions", () => {
  assertEquals(
    htmlToMd('<a href="url1">text1</a> <a href="url2">text2</a>', {
      refLinks: true,
    }),
    "[text1][1] [text2][2]\n\n[1]: url1\n[2]: url2",
  );
});

Deno.test("link - reference definitions deduplication", () => {
  assertEquals(
    htmlToMd('<a href="url">text1</a> <a href="url">text2</a>', {
      refLinks: true,
    }),
    "[text1][1] [text2][1]\n\n[1]: url",
  );
});

Deno.test("image - basic", () => {
  assertEquals(htmlToMd('<img src="img.png" alt="alt">'), "![alt](img.png)");
});

Deno.test("image - with title", () => {
  assertEquals(
    htmlToMd('<img src="img.png" alt="alt" title="title">'),
    '![alt](img.png "title")',
  );
});

Deno.test("image - no src", () => {
  assertEquals(htmlToMd("<img>"), "");
});

Deno.test("image - data URI removed by default", () => {
  assertEquals(
    htmlToMd('<img src="data:image/png;base64,abc" alt="test">'),
    "",
  );
});

Deno.test("image - data URI kept when configured", () => {
  assertEquals(
    htmlToMd('<img src="data:image/png;base64,abc" alt="test">', {
      keepDataImages: true,
    }),
    "![test](data:image/png;base64,abc)",
  );
});

Deno.test("image - no alt", () => {
  assertEquals(htmlToMd('<img src="img.png">'), "![](img.png)");
});

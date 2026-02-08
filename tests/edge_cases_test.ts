import { assertEquals } from "@std/assert";
import { batchHtmlToMd, htmlToMd, MdEngine } from "../mod.ts";

Deno.test("DOCTYPE removed", () => {
  assertEquals(htmlToMd("<!DOCTYPE html>abc"), "abc");
});

Deno.test("DOCTYPE html5 full", () => {
  assertEquals(
    htmlToMd("<!DOCTYPE html><html><body>text</body></html>"),
    "text",
  );
});

Deno.test("empty input", () => {
  assertEquals(htmlToMd(""), "");
});

Deno.test("plain text", () => {
  assertEquals(htmlToMd("hello world"), "hello world");
});

Deno.test("whitespace collapse", () => {
  assertEquals(htmlToMd("<p>a   b   c</p>"), "a b c");
});

Deno.test("newline collapse in text", () => {
  assertEquals(htmlToMd("<p>a\n\n\nb</p>"), "a b");
});

Deno.test("special chars escaped", () => {
  const result = htmlToMd("<p>*text* [link] `code` _italic_</p>");
  assertEquals(result.includes("\\*"), true);
  assertEquals(result.includes("\\["), true);
  assertEquals(result.includes("\\`"), true);
  assertEquals(result.includes("\\_"), true);
});

Deno.test("script tags ignored", () => {
  assertEquals(htmlToMd("<p>text</p><script>alert('hi')</script>"), "text");
});

Deno.test("style tags ignored", () => {
  assertEquals(htmlToMd("<p>text</p><style>body{}</style>"), "text");
});

Deno.test("meta tags ignored", () => {
  assertEquals(htmlToMd('<meta charset="utf-8"><p>text</p>'), "text");
});

Deno.test("mixed-case tags", () => {
  assertEquals(htmlToMd("<B>bold</B>"), "**bold**");
  assertEquals(htmlToMd("<STRONG>bold</STRONG>"), "**bold**");
  assertEquals(htmlToMd("<Em>italic</Em>"), "_italic_");
});

Deno.test("MdEngine class - reusable instance", () => {
  const engine = new MdEngine({ bulletMarker: "-" });
  assertEquals(engine.convert("<ul><li>a</li></ul>"), "- a");
  assertEquals(engine.convert("<ul><li>b</li></ul>"), "- b");
});

Deno.test("MdEngine class - convertBatch", () => {
  const engine = new MdEngine();
  const result = engine.convertBatch({
    "file1.html": "<h1>Hello</h1>",
    "file2.html": "<p>World</p>",
  });
  assertEquals(result["file1.html"], "# Hello");
  assertEquals(result["file2.html"], "World");
});

Deno.test("batchHtmlToMd function", () => {
  const result = batchHtmlToMd({
    a: "<b>bold</b>",
    b: "<em>italic</em>",
  });
  assertEquals(result["a"], "**bold**");
  assertEquals(result["b"], "_italic_");
});

Deno.test("nested divs flatten", () => {
  assertEquals(htmlToMd("<div><div><div>text</div></div></div>"), "text");
});

Deno.test("empty elements removed", () => {
  assertEquals(htmlToMd("<b></b><em></em><div></div>"), "");
});

Deno.test("nbsp preserved", () => {
  const result = htmlToMd("<p>&nbsp;text&nbsp;</p>");
  assertEquals(result.includes("text"), true);
});

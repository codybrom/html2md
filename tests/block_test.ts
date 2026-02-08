import { assertEquals } from "@std/assert";
import { htmlToMd } from "../mod.ts";

Deno.test("br", () => {
  assertEquals(htmlToMd("a<br>b"), "a  \nb");
});

Deno.test("hr", () => {
  assertEquals(htmlToMd("a<hr>b"), "a\n\n---\n\nb");
});

Deno.test("h1", () => {
  assertEquals(htmlToMd("<h1>heading</h1>"), "# heading");
});

Deno.test("h2", () => {
  assertEquals(htmlToMd("<h2>heading</h2>"), "## heading");
});

Deno.test("h3", () => {
  assertEquals(htmlToMd("<h3>heading</h3>"), "### heading");
});

Deno.test("h4", () => {
  assertEquals(htmlToMd("<h4>heading</h4>"), "#### heading");
});

Deno.test("h5", () => {
  assertEquals(htmlToMd("<h5>heading</h5>"), "##### heading");
});

Deno.test("h6", () => {
  assertEquals(htmlToMd("<h6>heading</h6>"), "###### heading");
});

Deno.test("multiple headings", () => {
  assertEquals(
    htmlToMd("<h1>h1</h1><h2>h2</h2><h3>h3</h3>"),
    "# h1\n\n## h2\n\n### h3",
  );
});

Deno.test("blockquote - basic", () => {
  assertEquals(htmlToMd("<blockquote>text</blockquote>"), "> text");
});

Deno.test("blockquote - with br", () => {
  assertEquals(htmlToMd("<blockquote>a<br>b</blockquote>"), "> a  \n> b");
});

Deno.test("blockquote - nested", () => {
  assertEquals(
    htmlToMd("<blockquote>a<blockquote>b</blockquote></blockquote>"),
    "> a\n> \n>> b",
  );
});

Deno.test("pre - preserves whitespace", () => {
  const html = "text<pre>  code\n    indented\n</pre>text";
  const result = htmlToMd(html);
  assertEquals(result, "text\n\n```\n  code\n    indented\n\n```\n\ntext");
});

Deno.test("pre - no escaping", () => {
  assertEquals(
    htmlToMd("<pre>*not bold* [not link]</pre>"),
    "```\n*not bold* [not link]\n```",
  );
});

Deno.test("paragraph spacing", () => {
  assertEquals(htmlToMd("<p>a</p><p>b</p>"), "a\n\nb");
});

Deno.test("div spacing", () => {
  assertEquals(htmlToMd("<div>a</div><div>b</div>"), "a\n\nb");
});

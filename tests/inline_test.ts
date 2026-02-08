import { assertEquals } from "@std/assert";
import { htmlToMd } from "../mod.ts";

Deno.test("bold - basic", () => {
  assertEquals(htmlToMd("<b>text</b>"), "**text**");
});

Deno.test("bold - multiple tags", () => {
  assertEquals(htmlToMd("<strong>a</strong> <b>b</b>"), "**a** **b**");
});

Deno.test("bold - whitespace only removed", () => {
  assertEquals(htmlToMd("<b>  </b>"), "");
});

Deno.test("bold - moves whitespace outside delimiters", () => {
  assertEquals(htmlToMd("a<b> text </b>b"), "a **text** b");
});

Deno.test("italic - basic", () => {
  assertEquals(htmlToMd("<em>text</em>"), "_text_");
});

Deno.test("italic - i tag", () => {
  assertEquals(htmlToMd("<i>text</i>"), "_text_");
});

Deno.test("italic - whitespace only removed", () => {
  assertEquals(htmlToMd("<em>  </em>"), "");
});

Deno.test("strikethrough - del", () => {
  assertEquals(htmlToMd("<del>text</del>"), "~~text~~");
});

Deno.test("strikethrough - s tag", () => {
  assertEquals(htmlToMd("<s>text</s>"), "~~text~~");
});

Deno.test("strikethrough - strike tag", () => {
  assertEquals(htmlToMd("<strike>text</strike>"), "~~text~~");
});

Deno.test("strikethrough - all variants", () => {
  assertEquals(
    htmlToMd("<del>text</del> <s>text</s> <strike>text</strike>"),
    "~~text~~ ~~text~~ ~~text~~",
  );
});

Deno.test("inline code - basic", () => {
  assertEquals(htmlToMd("<code>code</code>"), "`code`");
});

Deno.test("inline code - with backticks", () => {
  assertEquals(htmlToMd("<code>`` text ``</code>"), "``` `` text `` ```");
});

Deno.test("inline code - no escaping inside", () => {
  assertEquals(htmlToMd("<code>*not bold*</code>"), "`*not bold*`");
});

Deno.test("nested bold - duplicates removed", () => {
  assertEquals(htmlToMd("<b>text <b>bold</b> text</b>"), "**text bold text**");
});

Deno.test("mixed inline formatting", () => {
  assertEquals(
    htmlToMd("<b>bold</b> and <em>italic</em>"),
    "**bold** and _italic_",
  );
});

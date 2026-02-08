import { assertEquals } from "@std/assert";
import { htmlToMd } from "../mod.ts";

Deno.test("unordered list - basic", () => {
  assertEquals(htmlToMd("<ul><li>a</li><li>b</li></ul>"), "* a\n* b");
});

Deno.test("ordered list - basic", () => {
  assertEquals(
    htmlToMd("<ol><li>a</li><li>b</li><li>c</li></ol>"),
    "1. a\n2. b\n3. c",
  );
});

Deno.test("unordered list - 2 level nesting", () => {
  assertEquals(
    htmlToMd("<ul><li>a<ul><li>b</li><li>c</li></ul></li></ul>"),
    "* a\n  * b\n  * c",
  );
});

Deno.test("ordered list - 2 level nesting", () => {
  assertEquals(
    htmlToMd("<ol><li>a<ol><li>b</li><li>c</li></ol></li></ol>"),
    "1. a\n  1. b\n  2. c",
  );
});

Deno.test("mixed nesting - ol with nested ul", () => {
  assertEquals(
    htmlToMd("<ol><li>a<ul><li>b</li></ul></li><li>c</li></ol>"),
    "1. a\n  * b\n2. c",
  );
});

Deno.test("mixed nesting - ul with nested ol", () => {
  assertEquals(
    htmlToMd("<ul><li>a<ol><li>b</li><li>c</li></ol></li></ul>"),
    "* a\n  1. b\n  2. c",
  );
});

Deno.test("empty list item - removed", () => {
  assertEquals(htmlToMd("<ul><li> </li><li>a</li></ul>"), "* a");
});

Deno.test("list with images in item", () => {
  assertEquals(htmlToMd('<ul><li><img src="x"></li></ul>'), "* ![](x)");
});

Deno.test("top-level list has double newline spacing", () => {
  assertEquals(htmlToMd("a<ul><li>b</li></ul>c"), "a\n\n* b\n\nc");
});

Deno.test("nested list has single newline spacing", () => {
  assertEquals(
    htmlToMd("<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>"),
    "* a\n  * b\n* c",
  );
});

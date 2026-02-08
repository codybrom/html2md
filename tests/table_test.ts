import { assertEquals } from "@std/assert";
import { htmlToMd } from "../mod.ts";

Deno.test("table - single cell", () => {
  assertEquals(
    htmlToMd("<table><tr><td>col1</td></tr></table>"),
    "| col1 |\n| ---- |",
  );
});

Deno.test("table - single row two columns", () => {
  assertEquals(
    htmlToMd("<table><tr><td>a</td><td>b</td></tr></table>"),
    "| a | b |\n| - | - |",
  );
});

Deno.test("table - multiple rows", () => {
  assertEquals(
    htmlToMd(
      "<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>",
    ),
    "| a | b |\n| - | - |\n| c | d |",
  );
});

Deno.test("table - with caption", () => {
  assertEquals(
    htmlToMd("<table><caption>Title</caption><tr><td>a</td></tr></table>"),
    "__Title__\n| a |\n| - |",
  );
});

Deno.test("table - pipe escaping in cells", () => {
  assertEquals(
    htmlToMd("<table><tr><td>A|B</td></tr></table>"),
    "| A\\|B |\n| ---- |",
  );
});

Deno.test("table - formatting in cells", () => {
  assertEquals(
    htmlToMd("<table><tr><td><b>bold</b></td></tr></table>"),
    "| **bold** |\n| -------- |",
  );
});

Deno.test("table - empty cells preserved", () => {
  assertEquals(
    htmlToMd("<table><tr><td></td><td>b</td></tr></table>"),
    "|  | b |\n|  | - |",
  );
});

Deno.test("table - images in cells", () => {
  assertEquals(
    htmlToMd('<table><tr><td><img src="url" alt="img"></td></tr></table>'),
    "| ![img](url) |\n| ----------- |",
  );
});

Deno.test("table - block spacing", () => {
  assertEquals(
    htmlToMd("text<table><tr><td>a</td></tr></table>text"),
    "text\n\n| a |\n| - |\n\ntext",
  );
});

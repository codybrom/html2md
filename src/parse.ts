import { DOMParser, type Element } from "@b-fuze/deno-dom";

/**
 * Parse an HTML string and return the body element.
 * Strips DOCTYPE declarations before parsing.
 */
export function parseHtml(html: string): Element {
  const clean = html.replace(/<!DOCTYPE[^>]*>/gi, "");
  const doc = new DOMParser().parseFromString(
    `<html><body>${clean}</body></html>`,
    "text/html",
  );
  return doc!.body as Element;
}

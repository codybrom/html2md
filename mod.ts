/**
 * @module
 * Fast HTML-to-Markdown converter for Deno.
 *
 * @example
 * ```ts
 * import { htmlToMd } from "@codybrom/html2md";
 *
 * const md = htmlToMd("<h1>Hello</h1><p>World</p>");
 * console.log(md);
 * // # Hello
 * //
 * // World
 * ```
 */

import type { MdOptions } from "./src/config.ts";
import { DEFAULT_OPTIONS } from "./src/config.ts";
import { parseHtml } from "./src/parse.ts";
import { convert } from "./src/convert.ts";

export { DEFAULT_OPTIONS } from "./src/config.ts";
/** @deprecated Use MdOptions instead. */
export type MdConfig = MdOptions;
/** @deprecated Use DEFAULT_OPTIONS instead. */
export { DEFAULT_OPTIONS as DEFAULT_CONFIG } from "./src/config.ts";
export type { MdOptions } from "./src/config.ts";

/**
 * Merge user options with defaults, producing a complete MdOptions.
 */
function mergeOptions(partial?: Partial<MdOptions>): MdOptions {
  if (!partial) return { ...DEFAULT_OPTIONS };
  return {
    ...DEFAULT_OPTIONS,
    ...partial,
    skipTags: partial.skipTags ?? DEFAULT_OPTIONS.skipTags,
    extraBlockTags: partial.extraBlockTags ?? DEFAULT_OPTIONS.extraBlockTags,
    textReplacements: partial.textReplacements ??
      DEFAULT_OPTIONS.textReplacements,
  };
}

/**
 * Convert a single HTML string to Markdown.
 */
export function htmlToMd(
  html: string,
  config?: Partial<MdOptions>,
): string {
  const opts = mergeOptions(config);
  return convert(parseHtml(html), opts);
}

/**
 * Convert multiple HTML strings to Markdown in batch.
 * Shares the same options for efficiency.
 */
export function batchHtmlToMd(
  files: Record<string, string>,
  config?: Partial<MdOptions>,
): Record<string, string> {
  const opts = mergeOptions(config);
  const result: Record<string, string> = {};
  for (const [name, html] of Object.entries(files)) {
    result[name] = convert(parseHtml(html), opts);
  }
  return result;
}

/**
 * Reusable conversion engine with frozen configuration.
 */
export class MdEngine {
  private opts: MdOptions;

  constructor(config?: Partial<MdOptions>) {
    this.opts = Object.freeze(mergeOptions(config));
  }

  /** Convert a single HTML string to Markdown. */
  convert(html: string): string {
    return convert(parseHtml(html), this.opts);
  }

  /** Convert multiple HTML strings to Markdown. */
  convertBatch(files: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [name, html] of Object.entries(files)) {
      result[name] = convert(parseHtml(html), this.opts);
    }
    return result;
  }
}

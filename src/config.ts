/**
 * Converter options and element classification.
 *
 * Element categories are derived from the HTML Living Standard content model:
 * https://html.spec.whatwg.org/multipage/dom.html#content-models
 */

/** Configuration for the HTML-to-Markdown converter. */
export interface MdOptions {
  /** Fence delimiter for code blocks (default: "```") */
  codeFence: string;
  /** Bullet marker for unordered lists (default: "*") */
  bulletMarker: string;
  /** Indentation string for nested lists (default: "  ") */
  indent: string;
  /** Code block style: "fenced" or "indented" (default: "fenced") */
  codeBlockStyle: "fenced" | "indented";
  /** Delimiter for emphasis/italic (default: "_") */
  emphasisMark: string;
  /** Delimiter for strong/bold (default: "**") */
  strongMark: string;
  /** Delimiter for strikethrough (default: "~~") */
  strikeMark: string;
  /** Maximum consecutive blank lines allowed (default: 3) */
  maxBlankLines: number;
  /** HTML tags to completely ignore (children not parsed) */
  skipTags: string[];
  /** Additional tags to treat as block-level elements */
  extraBlockTags: string[];
  /** Global character escape pattern: [regex, replacement] */
  charEscape: [RegExp, string];
  /** Line-start escape patterns: [[regex, replacement], ...] */
  lineLeadEscape: [RegExp, string][];
  /** Custom text replacement patterns */
  textReplacements: [RegExp, string][];
  /** Keep images with data: URIs (default: false) */
  keepDataImages: boolean;
  /** Use link reference definitions instead of inline (default: false) */
  refLinks: boolean;
  /** Use <url> autolink syntax when text matches href (default: true) */
  autolinks: boolean;
}

/** Frozen default options. */
export const DEFAULT_OPTIONS: Readonly<MdOptions> = Object.freeze({
  codeFence: "```",
  bulletMarker: "*",
  indent: "  ",
  codeBlockStyle: "fenced" as const,
  emphasisMark: "_",
  strongMark: "**",
  strikeMark: "~~",
  maxBlankLines: 3,
  skipTags: [],
  extraBlockTags: [],
  charEscape: [/(?=[\\`*_~\[\]])/g, "\\"] as [RegExp, string],
  lineLeadEscape: [
    [/^(\s*)([-=>]|#{1,6}(?=[ \t])|\+(?=[ \t]))/gm, "$1\\$2"],
    [/^(\s*\d+)(\.(?=[ \t]))/gm, "$1\\$2"],
  ] as [RegExp, string][],
  textReplacements: [],
  keepDataImages: false,
  refLinks: false,
  autolinks: true,
});

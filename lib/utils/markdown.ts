import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";
import { addHeadingIds } from "./toc";

/**
 * Converts a markdown string to HTML.
 *
 * This is the single source of truth for markdown rendering, used by the
 * server (post pages / API), the post detail modal, and the editor preview so
 * that all three stay visually identical.
 *
 * Supports: GFM (tables, task lists, strikethrough, autolinks), LaTeX math
 * ($...$ and $$...$$), syntax highlighting for fenced code blocks, raw HTML
 * passthrough (e.g. YouTube embeds), and external links opening in a new tab.
 * Heading ids are added afterwards so the table of contents can anchor to them.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeExternalLinks, {
      target: "_blank",
      rel: ["noopener", "noreferrer"],
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return addHeadingIds(String(file));
}

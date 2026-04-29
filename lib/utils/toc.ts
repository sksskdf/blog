export interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[<>[\]{}()|\\^$*+?.]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Adds id attributes to h1–h6 headings in an HTML string.
 */
export function addHeadingIds(html: string): string {
  const usedIds = new Map<string, number>();

  return html.replace(/<(h[1-6])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, content) => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    let baseId = slugify(text) || "heading";

    const count = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count}`;

    return `<${tag}${attrs} id="${id}">${content}</${tag}>`;
  });
}

/**
 * Extracts TOC items from HTML that already has id attributes on headings.
 */
export function extractTocItems(html: string): TocItem[] {
  const items: TocItem[] = [];
  const regex = /<h([1-6])[^>]*\sid="([^"]*)"[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    const text = match[3].replace(/<[^>]*>/g, "").trim();
    if (text) {
      items.push({ id, text, level });
    }
  }

  return items;
}

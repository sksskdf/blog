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

// 외부 패키지 타입에 의존하지 않도록 필요한 hast 노드 형태만 정의
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const HEADING_TAG = /^h[1-6]$/;

function walk(node: HastNode, visit: (node: HastNode) => void): void {
  visit(node);
  node.children?.forEach((child) => walk(child, visit));
}

function nodeText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(nodeText).join("");
}

/**
 * rehype 플러그인: id가 없는 h1–h6 제목에 id를 부여합니다.
 *
 * 문자열이 아닌 구문 트리에서 동작하므로 제목 텍스트가 HTML 엔티티로
 * 인코딩되기 전의 원래 문자로 id를 만들고, raw HTML로 작성된 제목에
 * 이미 있는 id는 그대로 둡니다(중복 id 속성 방지).
 */
export function rehypeHeadingIds() {
  return (tree: HastNode) => {
    const usedIds = new Set<string>();
    const headings: HastNode[] = [];

    walk(tree, (node) => {
      if (node.type !== "element") return;
      const existingId = node.properties?.id;
      if (typeof existingId === "string" && existingId) {
        usedIds.add(existingId);
      } else if (node.tagName && HEADING_TAG.test(node.tagName)) {
        headings.push(node);
      }
    });

    headings.forEach((heading) => {
      const baseId = slugify(nodeText(heading).trim()) || "heading";
      let id = baseId;
      let count = 1;
      while (usedIds.has(id)) {
        id = `${baseId}-${count++}`;
      }
      usedIds.add(id);
      heading.properties = { ...heading.properties, id };
    });
  };
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const codePoint =
        entity[1] === "x" || entity[1] === "X"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
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
    // 속성값/텍스트는 엔티티로 인코딩되어 있으므로 DOM과 일치하도록 디코딩
    const id = decodeEntities(match[2]);
    const text = decodeEntities(match[3].replace(/<[^>]*>/g, "")).trim();
    if (text) {
      items.push({ id, text, level });
    }
  }

  return items;
}

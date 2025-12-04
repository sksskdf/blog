import { Post } from '../../types';

/**
 * 카테고리 관련 유틸리티 함수
 */

/**
 * 게시글에서 모든 카테고리 추출
 */
export function extractCategories(posts: Post[]): string[] {
  const allCategories = new Set<string>();
  
  posts.forEach((post) => {
    if (post.category) {
      if (Array.isArray(post.category)) {
        post.category.forEach((cat) => {
          if (cat) allCategories.add(cat);
        });
      } else if (typeof post.category === "string") {
        const tags = post.category
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
        tags.forEach((tag) => allCategories.add(tag));
      } else if (post.category) {
        allCategories.add(post.category);
      }
    }
  });
  
  return Array.from(allCategories).sort();
}

/**
 * 게시글을 카테고리로 필터링
 */
export function filterPostsByCategory(
  posts: Post[],
  category: string | null
): Post[] {
  if (!category) {
    return posts;
  }

  return posts.filter((post) => {
    if (!post.category) return false;

    if (Array.isArray(post.category)) {
      return post.category.includes(category);
    }

    if (typeof post.category === "string") {
      const tags = post.category.split(",").map((tag) => tag.trim());
      return tags.includes(category);
    }

    return post.category === category;
  });
}

/**
 * 카테고리 텍스트 추출 (표시용)
 */
export function getCategoryText(category: string | null | string[]): string {
  if (!category) return "POST";
  
  if (Array.isArray(category)) {
    return category[0] || "POST";
  }
  
  if (typeof category === "string") {
    return category.split(",")[0].trim() || "POST";
  }
  
  return category || "POST";
}


import path from 'path';

const postsDirectory = path.join(process.cwd(), 'posts');

// Validate and sanitize post ID to prevent path traversal
export function validatePostId(id) {
  // Allow only alphanumeric characters, hyphens, and underscores
  const validIdPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validIdPattern.test(id)) {
    return false;
  }
  // Additional check: ensure id doesn't contain path separators
  if (id.includes('/') || id.includes('\\') || id.includes('..')) {
    return false;
  }
  // Ensure the resolved path is within the posts directory
  const filePath = path.join(postsDirectory, `${id}.md`);
  const resolvedPath = path.resolve(filePath);
  const resolvedPostsDir = path.resolve(postsDirectory);
  return resolvedPath.startsWith(resolvedPostsDir + path.sep);
}

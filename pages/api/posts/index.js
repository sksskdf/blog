import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'posts');

// Validate and sanitize post ID to prevent path traversal
function validatePostId(id) {
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

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create a new post
    const { id, title, date, content } = req.body;

    if (!id || !title || !date || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate post ID to prevent path traversal
    if (!validatePostId(id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Check if post already exists
    const filePath = path.join(postsDirectory, `${id}.md`);
    try {
      await fs.access(filePath);
      return res.status(409).json({ error: 'Post already exists' });
    } catch {
      // File doesn't exist, continue
    }

    // Create markdown file with frontmatter
    const fileContent = matter.stringify(content, { title, date });
    
    try {
      await fs.writeFile(filePath, fileContent, 'utf8');
      return res.status(201).json({ message: 'Post created successfully', id });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

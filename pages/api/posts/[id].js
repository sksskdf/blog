import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'posts');

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    // Update an existing post
    const { title, date, content } = req.body;

    if (!title || !date || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const filePath = path.join(postsDirectory, `${id}.md`);
    
    // Check if post exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Update markdown file with frontmatter
    const fileContent = matter.stringify(content, { title, date });
    
    try {
      await fs.writeFile(filePath, fileContent, 'utf8');
      return res.status(200).json({ message: 'Post updated successfully', id });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update post' });
    }
  } else if (req.method === 'DELETE') {
    // Delete a post
    const filePath = path.join(postsDirectory, `${id}.md`);
    
    // Check if post exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Post not found' });
    }

    try {
      await fs.unlink(filePath);
      return res.status(200).json({ message: 'Post deleted successfully', id });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

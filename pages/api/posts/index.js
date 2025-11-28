import { createPost } from '../../../lib/posts';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, title, date, content } = req.body;

    if (!id || !title || !date || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    createPost(id, title, date, content);

    res.status(200).json({ success: true, message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
}


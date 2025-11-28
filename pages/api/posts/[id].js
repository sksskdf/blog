import { updatePost, deletePost, getPostRawData } from '../../../lib/posts';

export default function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  if (req.method === 'PUT') {
    try {
      const { title, date, content } = req.body;

      if (!title || !date || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      updatePost(id, title, date, content);

      res.status(200).json({ success: true, message: 'Post updated successfully' });
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const success = deletePost(id);

      if (success) {
        res.status(200).json({ success: true, message: 'Post deleted successfully' });
      } else {
        res.status(404).json({ error: 'Post not found' });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  } else if (req.method === 'GET') {
    try {
      const postData = getPostRawData(id);
      res.status(200).json(postData);
    } catch (error) {
      console.error('Error getting post:', error);
      res.status(500).json({ error: 'Failed to get post' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}


import { updatePost, deletePost, getPostRawData } from '../../../lib/posts';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  if (req.method === 'PUT') {
    try {
      const { title, date, content, category } = req.body;

      if (!title || !date || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const success = await updatePost(id, title, date, content, category || null);

      if (success) {
        res.status(200).json({ success: true, message: 'Post updated successfully' });
      } else {
        res.status(404).json({ error: 'Post not found' });
      }
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const success = await deletePost(id);

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
      const postData = await getPostRawData(id);
      
      if (!postData) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      res.status(200).json(postData);
    } catch (error) {
      console.error('Error getting post:', error);
      res.status(500).json({ error: 'Failed to get post' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}


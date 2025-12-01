import { getTodayVisitorCount } from '../../lib/visitor-stats';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const count = await getTodayVisitorCount();
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    res.status(500).json({ error: 'Failed to get visitor stats' });
  }
}


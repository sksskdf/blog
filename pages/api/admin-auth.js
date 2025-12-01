export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password === adminPassword) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid password' });
}


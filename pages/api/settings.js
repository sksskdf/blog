import { getSettings, updateSettings } from '../../lib/settings';

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const settings = getSettings();
      res.status(200).json(settings);
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, siteTitle, subtitle } = req.body;
      const updatedSettings = updateSettings({ name, siteTitle, subtitle });
      res.status(200).json(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}


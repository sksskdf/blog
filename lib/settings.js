import fs from 'fs';
import path from 'path';

const settingsPath = path.join(process.cwd(), 'settings.json');

const defaultSettings = {
  name: 'Harry-',
  siteTitle: "HARRY'S BLOG",
  subtitle: 'Software Developer',
};

export function getSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const fileContents = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(fileContents);
      return { ...defaultSettings, ...settings };
    }
  } catch (error) {
    console.error('Error reading settings:', error);
  }
  return defaultSettings;
}

export function updateSettings(newSettings) {
  try {
    const currentSettings = getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2), 'utf8');
    return updatedSettings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}


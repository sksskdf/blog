import { queryOne, query } from './db';
import { Settings, SettingsRow } from '../types';

export const defaultSettings: Settings = {
  name: "Harry-",
  siteTitle: "HARRY'S BLOG",
  subtitle: "Programmer",
  description: "",
};

export async function getSettings(): Promise<Settings> {
  try {
    const settings = await queryOne(
      'SELECT name, site_title, subtitle, description FROM settings WHERE id = 1'
    ) as SettingsRow | null;
    
    if (settings) {
      return {
        name: settings.name || defaultSettings.name,
        siteTitle: settings.site_title || defaultSettings.siteTitle,
        subtitle: settings.subtitle || defaultSettings.subtitle,
        description: settings.description || defaultSettings.description,
      };
    }
  } catch (error) {
    console.error('Error reading settings:', error);
  }
  return defaultSettings;
}

export async function updateSettings(newSettings: Partial<Settings>): Promise<Settings> {
  try {
    const { name, siteTitle, subtitle, description } = newSettings;
    
    // 기존 설정이 있는지 확인
    const existing = await queryOne('SELECT id FROM settings WHERE id = 1');
    
    if (existing) {
      // 업데이트
      await query(
        'UPDATE settings SET name = $1, site_title = $2, subtitle = $3, description = $4, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
        [name || null, siteTitle || null, subtitle || null, description || null]
      );
    } else {
      // 삽입
      await query(
        'INSERT INTO settings (id, name, site_title, subtitle, description, updated_at) VALUES (1, $1, $2, $3, $4, CURRENT_TIMESTAMP)',
        [name || null, siteTitle || null, subtitle || null, description || null]
      );
    }
    
    return await getSettings();
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}


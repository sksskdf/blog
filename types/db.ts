export interface QueryResult {
  rowCount: number;
  [key: string]: unknown;
}

export interface PostRow {
  id: string;
  title: string;
  date: Date | string;
  category: string | null;
  content: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PlaylistRow {
  id: number;
  title: string;
  artist: string | null;
  url: string;
  cover: string | null;
  duration: number | null;
  display_order: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface SettingsRow {
  id: number;
  name: string | null;
  site_title: string | null;
  subtitle: string | null;
  description: string | null;
  updated_at?: Date;
}

export interface VisitorStatsRow {
  date: Date | string;
  count: number;
}


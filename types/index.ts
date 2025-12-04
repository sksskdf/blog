import { PostRow, PlaylistRow, SettingsRow } from './db';

export interface Post {
  id: string;
  title: string;
  date: string;
  category: string | null;
  contentHtml?: string;
  content?: string;
}

export interface PostParams {
  params: {
    id: string;
  };
}

export interface Playlist {
  id: number;
  title: string;
  artist: string | null;
  url: string;
  cover: string | null;
  duration: number | null;
  displayOrder?: number;
}

export interface Settings {
  name: string;
  siteTitle: string;
  subtitle: string;
  description: string;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export type { PostRow, PlaylistRow, SettingsRow };


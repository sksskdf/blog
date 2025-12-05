import { remark } from 'remark';
import html from 'remark-html';
import { query, queryOne } from './db';
import { Post, PostParams, PostRow } from '../types';
import { QueryResult } from '../types/db';

export async function getSortedPostsData(): Promise<Post[]> {
  try {
    const result = await query(
      'SELECT id, title, date, category FROM posts ORDER BY date DESC'
    );
    return result.map((row) => {
      const postRow = row as unknown as PostRow;
      return {
        id: postRow.id,
        title: postRow.title,
        date: postRow.date instanceof Date ? postRow.date.toISOString().split('T')[0] : postRow.date,
        category: postRow.category,
      };
    });
  } catch (error) {
    console.error('Error getting sorted posts:', error);
    return [];
  }
}

export async function getAllPostIds(): Promise<PostParams[]> {
  try {
    const result = await query('SELECT id FROM posts');
    return result.map((row) => ({
      params: {
        id: (row as unknown as { id: string }).id,
      },
    }));
  } catch (error) {
    console.error('Error getting post IDs:', error);
    return [];
  }
}

export async function getPostData(id: string): Promise<Post | null> {
  try {
    const post = (await queryOne(
      'SELECT id, title, date, category, content FROM posts WHERE id = $1',
      [id]
    )) as unknown as PostRow | null;

    if (!post) {
      return null;
    }

    const processedContent = await remark()
      .use(html)
      .process(post.content);
    const contentHtml = processedContent.toString();

    return {
      id: post.id,
      title: post.title,
      date: post.date instanceof Date ? post.date.toISOString().split('T')[0] : post.date,
      category: post.category,
      contentHtml,
    };
  } catch (error) {
    console.error('Error getting post data:', error);
    return null;
  }
}

export async function getPostRawData(id: string): Promise<Post | null> {
  try {
    const post = (await queryOne(
      'SELECT id, title, date, category, content FROM posts WHERE id = $1',
      [id]
    )) as unknown as PostRow | null;

    if (!post) {
      return null;
    }

    return {
      id: post.id,
      title: post.title || "",
      date: post.date instanceof Date ? post.date.toISOString().split('T')[0] : (post.date || ""),
      category: post.category || null,
      content: post.content || "",
    };
  } catch (error) {
    console.error('Error getting post raw data:', error);
    return null;
  }
}

export async function createPost(
  id: string,
  title: string,
  date: string,
  content: string,
  category: string | null = null
): Promise<boolean> {
  try {
    await query(
      'INSERT INTO posts (id, title, date, category, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [id, title, date, category, content]
    );
    return true;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

export async function updatePost(
  id: string,
  title: string,
  date: string,
  content: string,
  category: string | null = null
): Promise<boolean> {
  try {



    await query(
      'UPDATE posts SET title = $1, date = $2, category = $3, content = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
      [title, date, category, content, id]
    );
    

    const post = await getPostRawData(id);
    if (!post) {
      return false;
    }
    

    return post.title === title && post.date === date && post.content === content;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    const result = await query('DELETE FROM posts WHERE id = $1', [id]);
    return (result as unknown as { rowCount: number }).rowCount > 0;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}


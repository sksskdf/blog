import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout';
import Head from 'next/head';
import utilStyles from '../../../styles/utils.module.css';
import { getPostData, getAllPostIds } from '../../../lib/posts';

export async function getStaticPaths() {
  const paths = getAllPostIds();
  // Add 'new' as a special path for creating new posts
  return {
    paths: [
      ...paths,
      { params: { id: 'new' } }
    ],
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  if (params.id === 'new') {
    return {
      props: {
        postData: null,
        isNew: true,
      },
    };
  }

  const postData = await getPostData(params.id);
  return {
    props: {
      postData,
      isNew: false,
    },
  };
}

export default function EditPost({ postData, isNew }) {
  const router = useRouter();
  const [id, setId] = useState(postData?.id || '');
  const [title, setTitle] = useState(postData?.title || '');
  const [date, setDate] = useState(postData?.date || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (postData && postData.contentHtml) {
      // Extract content from contentHtml by removing HTML tags
      const div = document.createElement('div');
      div.innerHTML = postData.contentHtml;
      setContent(div.textContent || div.innerText || '');
    }
  }, [postData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isNew) {
        // Create new post
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, title, date, content }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create post');
        }

        alert('Post created successfully!');
        router.push(`/posts/${id}`);
      } else {
        // Update existing post
        const response = await fetch(`/api/posts/${postData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, date, content }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update post');
        }

        alert('Post updated successfully!');
        router.push(`/posts/${postData.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>{isNew ? 'New Post' : `Edit ${postData.title}`}</title>
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>
          {isNew ? 'Create New Post' : 'Edit Post'}
        </h1>
        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            Error: {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {isNew && (
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="id" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Post ID (URL slug):
              </label>
              <input
                type="text"
                id="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
                placeholder="e.g., my-first-post"
              />
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Title:
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="date" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Date:
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="content" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Content (Markdown):
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={15}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Saving...' : 'Save Post'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#eee',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </article>
    </Layout>
  );
}

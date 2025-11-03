import { useRouter } from "next/router";
import Layout from "../../components/layout";
import { getAllPostIds, getPostData } from "../../lib/posts";
import Head from "next/head";
import Date from "../../components/date";
import utilStyles from "../../styles/utils.module.css";

export async function getStaticPaths() {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const postData = await getPostData(params.id);
  return {
    props: {
      postData,
    },
  };
}

export default function Post({ postData }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postData.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      alert('Post deleted successfully!');
      router.push('/');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <Layout>
      <Head>
        <title>{postData.title}</title>
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
        <div className={utilStyles.lightText}>
          <Date dateString={postData.date} />
        </div>
        <br />
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => router.push(`/posts/edit/${postData.id}`)}
            style={{
              padding: '0.5rem 1rem',
              marginRight: '0.5rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Edit Post
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Delete Post
          </button>
        </div>
        <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
      </article>
    </Layout>
  );
}

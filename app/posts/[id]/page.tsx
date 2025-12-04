import { notFound } from 'next/navigation';
import Layout from "../../../components/layout";
import { getPostData } from "../../../lib/posts";
import { getSettings } from "../../../lib/settings";
import Date from "../../../components/date";
import utilStyles from "../../../styles/utils.module.css";
import { Metadata } from 'next';
import { Post, Settings } from '../../../types';

interface PostPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const postData = await getPostData(params.id);
  
  if (!postData) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: postData.title,
  };
}

export default async function Post({ params }: PostPageProps) {
  const postData = await getPostData(params.id);
  
  if (!postData) {
    notFound();
  }

  const settings = await getSettings();

  return (
    <Layout settings={settings}>
      <article>
        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
        <div className={utilStyles.lightText}>
          <Date dateString={postData.date} />
        </div>
        <br />
        {postData.contentHtml && (
          <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
        )}
      </article>
    </Layout>
  );
}


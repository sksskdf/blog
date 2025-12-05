import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Post, Settings } from "../../../types";
import { getPostData, getSortedPostsData, getPostRawData } from "../../../lib/posts";
import { getSettings } from "../../../lib/settings";
import {
  generatePostMetadata,
  generatePostStructuredData,
} from "../../../lib/seo";
import Layout from "../../../components/layout";
import Date from "../../../components/date";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const postData = await getPostData(id);
  const settings = await getSettings();

  if (!postData) {
    return {
      title: "Post Not Found",
    };
  }

  const postRawData = await getPostRawData(id);
  return generatePostMetadata(
    {
      id: postData.id,
      title: postData.title,
      date: postData.date,
      category: postData.category,
      content: postRawData?.content,
    },
    settings
  );
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const postData = await getPostData(id);

  if (!postData) {
    notFound();
  }

  const settings = await getSettings();
  const allPostsData = await getSortedPostsData();
  const postRawData = await getPostRawData(id);
  const structuredData = generatePostStructuredData(
    {
      id: postData.id,
      title: postData.title,
      date: postData.date,
      category: postData.category,
      content: postRawData?.content,
    },
    settings
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <Layout settings={settings} posts={allPostsData}>
        <article className="p-8 md:p-12 pb-28 md:pb-24">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-dark-text leading-tight">
            {postData.title}
          </h1>
          <div className="text-dark-muted font-mono text-sm mb-6">
            <Date dateString={postData.date} />
          </div>
          {postData.contentHtml && (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
            />
          )}
        </article>
      </Layout>
    </>
  );
}

import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Post, Settings } from "../../../types";
import { getPostData, getSortedPostsData } from "../../../lib/posts";
import { getSettings } from "../../../lib/settings";
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

  if (!postData) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: postData.title,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const postData = await getPostData(id);

  if (!postData) {
    notFound();
  }

  const settings = await getSettings();

  const allPostsData = await getSortedPostsData();

  return (
    <Layout settings={settings} posts={allPostsData}>
      <article className="p-8 md:p-12">
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
  );
}

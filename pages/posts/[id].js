import Layout from "../../components/layout";
import { getAllPostIds, getPostData } from "../../lib/posts";
import { getSettings } from "../../lib/settings";
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
  const settings = getSettings();
  return {
    props: {
      postData,
      settings,
    },
  };
}

export default function Post({ postData, settings }) {
  return (
    <Layout settings={settings}>
      <Head>
        <title>{postData.title}</title>
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
        <div className={utilStyles.lightText}>
          <Date dateString={postData.date} />
        </div>
        <br />
        <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
      </article>
    </Layout>
  );
}

import Layout from "../../components/layout";
import { getPostData } from "../../lib/posts";
import { getSettings } from "../../lib/settings";
import Head from "next/head";
import Date from "../../components/date";
import utilStyles from "../../styles/utils.module.css";

export async function getServerSideProps({ params }) {
  const postData = await getPostData(params.id);
  
  if (!postData) {
    return {
      notFound: true,
    };
  }

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

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import PostForm from "../components/post-form";
import Date from "../components/date";
import Layout from "../components/layout";
import { getSortedPostsData } from "../lib/posts";
import { getSettings } from "../lib/settings";
import utilStyles from "../styles/utils.module.css";

export async function getStaticProps() {
  const allPostsData = getSortedPostsData();
  const settings = getSettings();
  return {
    props: {
      allPostsData,
      settings,
    },
  };
}

export default function Home({ allPostsData, settings: initialSettings }) {
  const [settings, setSettings] = useState(
    initialSettings || { subtitle: "Software Developer" }
  );

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const subtitle = settings.subtitle || "Software Developer";
  const siteTitle = settings.siteTitle || "HARRY'S BLOG";

  return (
    <Layout home settings={settings}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <p>{subtitle}</p>
        </div>
      </section>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 className={utilStyles.headingLg}>Blog</h2>
        </div>
        <ul className={utilStyles.list}>
          {allPostsData.map(({ id, date, title }) => (
            <li className={utilStyles.listItem} key={id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Link href={`/posts/${id}`}>{title}</Link>
                  <br />
                  <small className={utilStyles.lightText}>
                    <Date dateString={date} />
                  </small>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}

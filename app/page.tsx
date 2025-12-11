import { Metadata } from "next";
import { getSortedPostsData } from "../lib/posts";
import { getSettings } from "../lib/settings";
import { generateBaseMetadata } from "../lib/seo";
import HomeClient from "../components/home-client";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return generateBaseMetadata(settings);
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const allPostsData = await getSortedPostsData();
  const settings = await getSettings();

  return <HomeClient initialPosts={allPostsData} initialSettings={settings} />;
}

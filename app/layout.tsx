import "../styles/globals.css";
import { AdminProvider } from "../contexts/admin-contexts";
import { MusicPlayerProvider } from "../contexts/music-player-context";
import AdminModeHandler from "../components/admin-mode-handler";
import MusicPlayerButton from "../components/music-player-button";
import { getSettings, defaultSettings } from "../lib/settings";
import { ReactNode } from "react";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteTitle = settings.siteTitle || defaultSettings.siteTitle;

  return {
    title: siteTitle,
    openGraph: {
      title: siteTitle,
      description: "Learn how to build a personal website using Next.js",
      images: [
        `https://og-image.vercel.app/${encodeURI(
          siteTitle
        )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`,
      ],
    },
  };
}

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&family=Noto+Sans+KR:wght@300;400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AdminProvider>
          <MusicPlayerProvider>
            <AdminModeHandler />
            {children}
            <MusicPlayerButton />
          </MusicPlayerProvider>
        </AdminProvider>
      </body>
    </html>
  );
}

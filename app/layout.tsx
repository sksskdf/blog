import "../styles/globals.css";
import { AdminProvider } from "../contexts/admin-contexts";
import { MusicPlayerProvider } from "../contexts/music-player-context";
import AdminModeHandler from "../components/admin-mode-handler";
import MusicPlayerButton from "../components/music-player-button";
import { getSettings, defaultSettings } from "../lib/settings";
import { ReactNode } from "react";
import { Metadata, Viewport } from "next";
import {
  generateBaseMetadata,
  generateWebsiteStructuredData,
} from "../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return generateBaseMetadata(settings);
}

export function generateViewport(): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  };
}

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const settings = await getSettings();
  const structuredData = generateWebsiteStructuredData(settings);

  return (
    <html lang="ko">
      <head>
        <meta
          name="google-site-verification"
          content="yLeXXVk5nzzS8QGnC7INAkNPrKIk-KVXbPjYjQKNEvQ"
        />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
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

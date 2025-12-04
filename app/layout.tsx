import '../styles/globals.css';
import { AdminProvider } from "../contexts/admin-contexts";
import AdminModeHandler from "../components/admin-mode-handler";
import { getSettings } from "../lib/settings";
import { ReactNode } from 'react';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteTitle = settings.siteTitle || "HARRY'S BLOG";

  return {
    title: siteTitle,
    description: "Learn how to build a personal website using Next.js",
    icons: {
      icon: '/favicon.ico',
    },
    openGraph: {
      title: siteTitle,
      description: "Learn how to build a personal website using Next.js",
      images: [`https://og-image.vercel.app/${encodeURI(siteTitle)}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`],
    },
    twitter: {
      card: 'summary_large_image',
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
      </head>
      <body>
        <AdminProvider>
          <AdminModeHandler />
          {children}
        </AdminProvider>
      </body>
    </html>
  );
}


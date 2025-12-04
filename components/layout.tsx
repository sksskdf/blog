'use client';

import Image from "next/image";
import { useState, ReactNode } from "react";
import styles from "./layout.module.css";
import utilStyles from "../styles/utils.module.css";
import Link from "next/link";
import MusicPlayerButton from "./music-player-button";
import HamburgerButton from "./hamburger-button";
import Sidebar from "./sidebar";
import { Post, Settings } from '../types';

const name = "Harry-";
export const siteTitle = "HARRY'S BLOG";

interface LayoutProps {
  children: ReactNode;
  home?: boolean;
  posts?: Post[];
  onCategoryFilter?: (category: string | null) => void;
  selectedCategory?: string | null;
  settings?: Settings;
}

export default function Layout({ children, home, posts, onCategoryFilter, selectedCategory, settings }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleCategoryFilter = (category: string | null) => {
    if (onCategoryFilter) {
      onCategoryFilter(category);
    }
    closeSidebar();
  };

  return (
    <div className={styles.container}>
      <HamburgerButton isOpen={isSidebarOpen} onClick={toggleSidebar} />
      {home && posts && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          posts={posts}
          onCategoryFilter={handleCategoryFilter}
          selectedCategory={selectedCategory}
        />
      )}
      <header className={styles.header}>
        {home ? (
          <>
            <Image
              priority
              src="/images/profile.png"
              className={utilStyles.borderCircle}
              height={144}
              width={144}
              alt=""
            />
            <h1 className={utilStyles.heading2Xl}>{name}</h1>
          </>
        ) : (
          <>
            <Link href="/">
              <Image
                priority
                src="/images/profile.png"
                className={utilStyles.borderCircle}
                height={108}
                width={108}
                alt=""
              />
            </Link>
            <h2 className={utilStyles.headingLg}>
              <Link href="/" className={utilStyles.colorInherit}>
                {name}
              </Link>
            </h2>
          </>
        )}
      </header>
      <main>{children}</main>
      {!home && (
        <div className={styles.backToHome}>
          <Link href="/">← Back to home</Link>
        </div>
      )}
      <MusicPlayerButton />
    </div>
  );
}


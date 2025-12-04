'use client';

import { useState, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { Post, Settings } from "../types";
import { defaultSettings } from "../lib/settings";
import MusicPlayerButton from "./music-player-button";
import HamburgerButton from "./hamburger-button";
import Sidebar from "./sidebar";

interface LayoutProps {
  children: ReactNode;
  home?: boolean;
  posts?: Post[];
  onCategoryFilter?: (category: string | null) => void;
  selectedCategory?: string | null;
  settings?: Settings | null;
}

export default function Layout({
  children,
  home,
  posts,
  onCategoryFilter,
  selectedCategory,
  settings,
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const displayName = settings?.name || defaultSettings.name;
  const siteTitleText = settings?.siteTitle || defaultSettings.siteTitle;
  const subtitle = settings?.subtitle || defaultSettings.subtitle;
  const description = settings?.description || defaultSettings.description;

  return (
    <div className="h-screen bg-dark-bg relative overflow-x-hidden overflow-y-hidden flex flex-col">
      <div className="flex flex-row flex-1 min-h-0">
        {/* Left Sidebar - Desktop Only */}
        <aside className="w-1/3 max-w-[400px] h-full p-8 flex flex-col justify-between border-r border-dark-border bg-dark-bg hidden lg:flex overflow-y-auto overscroll-contain">
          <div>
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-3 h-3 bg-brand-green rounded-full animate-pulse"></div>
              <h1 className="font-mono font-bold text-xl tracking-tight text-dark-text">
                {siteTitleText.replace(/'S BLOG/i, "_LOGS")}
                <span className="text-dark-subtle">.sh</span>
              </h1>
            </Link>

            {/* Profile Section */}
            <div className="mb-8">
              <div className="relative w-full aspect-square max-w-[280px] mx-auto lg:mx-0 bg-dark-card rounded-xl border border-dark-border overflow-hidden flex items-center justify-center mb-6">
                {/* Subtle Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>

                {/* The Profile Image */}
                <div className="relative z-10 pt-2 opacity-90 hover:opacity-100 transition-opacity duration-300">
                  <Image
                    priority
                    src="/images/profile.png"
                    className="rounded-full"
                    height={280}
                    width={280}
                    alt=""
                  />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2 text-dark-text">
                {displayName}
              </h2>
              <p className="text-dark-muted font-mono text-sm leading-relaxed mb-6">
                {subtitle}
                {description && (
                  <>
                    <br />
                    {description}
                  </>
                )}
              </p>
              <div className="flex gap-4 text-xs font-mono text-brand-green">
                <a
                  href="https://github.com/sksskdf"
                  className="hover-underline-animation"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GITHUB
                </a>
                <a
                  href="mailto:sksskdfg123@gmail.com"
                  className="hover-underline-animation"
                >
                  EMAIL
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content */}
        <main className="flex-1 w-full lg:w-2/3 min-w-0 flex flex-col overflow-hidden">
          {/* Mobile Nav Header */}
          <div className="lg:hidden p-6 border-b border-dark-border flex justify-between items-center bg-dark-bg flex-shrink-0 z-[100]">
            <Link href="/" className="font-mono text-xs text-brand-green hover:opacity-80 transition-opacity cursor-pointer">
              /HOME/USER/BLOG
            </Link>
            <HamburgerButton isOpen={isSidebarOpen} onClick={toggleSidebar} />
          </div>

          {/* Desktop Header with Hamburger Button */}
          <div className="hidden lg:flex justify-end items-center p-6 border-b border-dark-border bg-dark-bg flex-shrink-0 z-[100]">
            <HamburgerButton isOpen={isSidebarOpen} onClick={toggleSidebar} />
          </div>

          <Sidebar
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
            posts={home && posts ? posts : []}
            onCategoryFilter={home && posts ? handleCategoryFilter : undefined}
            selectedCategory={home && posts ? (selectedCategory || null) : null}
            settings={settings}
          />

          <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {children}
          </div>
        </main>
      </div>
      <MusicPlayerButton />
    </div>
  );
}


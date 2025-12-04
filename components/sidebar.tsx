import { useState, useEffect } from 'react';
import Image from "next/image";

import { Post, Settings } from "../types";
import { defaultSettings } from "../lib/settings";
import { extractCategories } from "../lib/utils/category";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onCategoryFilter: (category: string | null) => void;
  selectedCategory: string | null;
  settings?: Settings | null;
}

export default function Sidebar({
  isOpen,
  onClose,
  posts,
  onCategoryFilter,
  selectedCategory: externalSelectedCategory,
  settings,
}: SidebarProps) {
  const displayName = settings?.name || defaultSettings.name;
  const siteTitleText = settings?.siteTitle || defaultSettings.siteTitle;
  const subtitle = settings?.subtitle || defaultSettings.subtitle;
  const description = settings?.description || defaultSettings.description;

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    externalSelectedCategory || null
  );

  useEffect(() => {
    // 외부에서 전달된 selectedCategory와 동기화
    setSelectedCategory(externalSelectedCategory || null);
  }, [externalSelectedCategory]);

  useEffect(() => {
    const extractedCategories = extractCategories(posts);
    setCategories(extractedCategories);
  }, [posts]);

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      // 같은 카테고리를 다시 클릭하면 필터 해제
      setSelectedCategory(null);
      onCategoryFilter(null);
    } else {
      setSelectedCategory(category);
      onCategoryFilter(category);
    }
  };

  const handleAllPostsClick = () => {
    setSelectedCategory(null);
    onCategoryFilter(null);
  };

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[998] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`fixed top-0 right-0 w-[280px] max-w-[80vw] h-screen bg-dark-card border-l border-dark-border shadow-lg z-[999] transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-brand-green rounded-full animate-pulse"></div>
            <h1 className="font-mono font-bold text-sm tracking-tight text-dark-text">
              {siteTitleText.replace(/'S BLOG/i, "_LOGS")}
              <span className="text-dark-subtle">.sh</span>
            </h1>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-transparent border border-dark-border-subtle rounded cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-dark-gray hover:border-brand-green hover:text-brand-green text-dark-muted"
            aria-label="닫기"
          >
            <span className="material-icons text-lg">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
          {/* Profile Section - Mobile */}
          <div className="lg:hidden mb-6 pb-6 border-b border-dark-border">
            <div className="relative w-full aspect-square max-w-[200px] mx-auto bg-dark-bg rounded-xl border border-dark-border overflow-hidden flex items-center justify-center mb-4">
              {/* Subtle Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>

              {/* The Profile Image */}
              <div className="relative z-10 pt-2 opacity-90 hover:opacity-100 transition-opacity duration-300">
                <Image
                  priority
                  src="/images/profile.png"
                  className="rounded-full"
                  height={200}
                  width={200}
                  alt=""
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-dark-text text-center">
              {displayName}
            </h2>
            <p className="text-dark-muted font-mono text-sm leading-relaxed mb-4 text-center">
              {subtitle}
              {description && (
                <>
                  <br />
                  {description}
                </>
              )}
            </p>
            <div className="flex gap-4 text-xs font-mono text-brand-green justify-center">
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

          {/* Category Section */}
          <div className="mb-4">
            <h3 className="font-mono text-sm text-brand-green mb-3">
              카테고리
            </h3>
            <button
              className={`block w-full px-4 py-3 mb-2 text-left text-sm font-mono transition-all duration-200 rounded ${
                selectedCategory === null
                  ? "bg-brand-green text-dark-card border border-brand-green font-bold"
                  : "bg-transparent text-dark-muted border border-dark-border-subtle hover:bg-dark-gray hover:border-brand-green hover:text-brand-green"
              }`}
              onClick={handleAllPostsClick}
            >
              전체 게시글
            </button>

            {categories.length > 0 ? (
              categories.map((category) => (
                <button
                  key={category}
                  className={`block w-full px-4 py-3 mb-2 text-left text-sm font-mono transition-all duration-200 rounded ${
                    selectedCategory === category
                      ? "bg-brand-green text-dark-card border border-brand-green font-bold"
                      : "bg-transparent text-dark-muted border border-dark-border-subtle hover:bg-dark-gray hover:border-brand-green hover:text-brand-green"
                  }`}
                  onClick={() => handleCategoryClick(category)}
                >
                  {category}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-dark-subtle text-sm font-mono">
                카테고리가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './sidebar.module.css';
import { Post } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onCategoryFilter: (category: string | null) => void;
  selectedCategory: string | null;
}

export default function Sidebar({ isOpen, onClose, posts, onCategoryFilter, selectedCategory: externalSelectedCategory }: SidebarProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(externalSelectedCategory || null);

  useEffect(() => {
    // 외부에서 전달된 selectedCategory와 동기화
    setSelectedCategory(externalSelectedCategory || null);
  }, [externalSelectedCategory]);

  useEffect(() => {
    // 게시글에서 모든 카테고리 추출
    const allCategories = new Set<string>();
    posts.forEach((post) => {
      if (post.category) {
        // 카테고리가 배열인 경우와 문자열인 경우 모두 처리
        if (Array.isArray(post.category)) {
          post.category.forEach((cat) => {
            if (cat) allCategories.add(cat);
          });
        } else if (typeof post.category === 'string') {
          // 쉼표로 구분된 태그 처리
          const tags = post.category.split(',').map((tag) => tag.trim()).filter(Boolean);
          tags.forEach((tag) => allCategories.add(tag));
        } else if (post.category) {
          allCategories.add(post.category);
        }
      }
    });
    setCategories(Array.from(allCategories).sort());
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
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      {/* 사이드바 */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}></div>

        <div className={styles.sidebarContent}>
          <button
            className={`${styles.categoryItem} ${
              selectedCategory === null ? styles.active : ""
            }`}
            onClick={handleAllPostsClick}
          >
            전체 게시글
          </button>

          {categories.length > 0 ? (
            categories.map((category) => (
              <button
                key={category}
                className={`${styles.categoryItem} ${
                  selectedCategory === category ? styles.active : ""
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))
          ) : (
            <div className={styles.noCategories}>카테고리가 없습니다.</div>
          )}
        </div>
      </div>
    </>
  );
}


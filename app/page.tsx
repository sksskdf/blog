'use client';

import { useEffect, useState } from "react";
import { remark } from "remark";
import html from "remark-html";
import Link from "next/link";
import PostForm from "../components/post-form";
import Date from "../components/date";
import Layout from "../components/layout";
import PlaylistEditor from "../components/playlist-editor";
import SettingsEditor from "../components/settings-editor";
import { useAdmin } from "../contexts/admin-contexts";
import utilStyles from "../styles/utils.module.css";
import { Post, Settings } from '../types';

export default function Home() {
  const { isAdmin } = useAdmin();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [allPostsData, setAllPostsData] = useState<Post[]>([]);
  const [settings, setSettings] = useState<Settings>({ 
    name: 'Harry-',
    siteTitle: "HARRY'S BLOG",
    subtitle: "Software Developer",
    description: ''
  });
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subtitleHtml, setSubtitleHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showPlaylistEditor, setShowPlaylistEditor] = useState<boolean>(false);
  const [showSettingsEditor, setShowSettingsEditor] = useState<boolean>(false);

  useEffect(() => {
    // 데이터 로드
    const loadData = async () => {
      try {
        // 방문자수 증가
        await fetch('/api/visitor-stats', { method: 'GET' });
        
        // 게시글 및 설정 로드
        const [postsRes, settingsRes] = await Promise.all([
          fetch('/api/posts'),
          fetch('/api/settings')
        ]);
        
        if (postsRes.ok) {
          const posts = await postsRes.json() as Post[];
          setAllPostsData(posts);
          setFilteredPosts(posts);
        }
        
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json() as Settings;
          setSettings(settingsData);
          const subtitle = settingsData.subtitle || "Software Developer";
          setSubtitleHtml(subtitle);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // subtitle을 마크다운으로 파싱
    const parseSubtitle = async () => {
      const currentSubtitle = settings.subtitle || "Software Developer";
      if (currentSubtitle) {
        try {
          const processed = await remark().use(html).process(currentSubtitle);
          setSubtitleHtml(processed.toString());
        } catch (error) {
          console.error("Error parsing subtitle:", error);
          setSubtitleHtml(currentSubtitle);
        }
      } else {
        setSubtitleHtml("");
      }
    };
    parseSubtitle();
  }, [settings.subtitle]);

  // 설정 편집 후 데이터 다시 로드
  useEffect(() => {
    if (!showSettingsEditor) {
      const reloadSettings = async () => {
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const settingsData = await response.json() as Settings;
            setSettings(settingsData);
          }
        } catch (error) {
          console.error("Error reloading settings:", error);
        }
      };
      reloadSettings();
    }
  }, [showSettingsEditor]);

  useEffect(() => {
    // 카테고리 필터링
    if (!selectedCategory) {
      setFilteredPosts(allPostsData);
      return;
    }

    const filtered = allPostsData.filter((post) => {
      if (!post.category) return false;

      // 배열인 경우
      if (Array.isArray(post.category)) {
        return post.category.includes(selectedCategory);
      }

      // 문자열인 경우 (쉼표로 구분된 태그)
      if (typeof post.category === "string") {
        const tags = post.category.split(",").map((tag) => tag.trim());
        return tags.includes(selectedCategory);
      }

      return post.category === selectedCategory;
    });

    setFilteredPosts(filtered);
  }, [selectedCategory, allPostsData]);

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleAddPost = () => {
    setEditingPost(null);
    setShowForm(true);
  };

  const handleEditPost = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "GET",
      });
      if (response.ok) {
        const postData = await response.json() as Post;
        setEditingPost(postData);
        setShowForm(true);
      } else {
        alert("게시글을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      alert("게시글을 불러오는데 실패했습니다.");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("게시글이 삭제되었습니다.");
        window.location.reload();
      } else {
        alert("게시글 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("게시글 삭제에 실패했습니다.");
    }
  };

  const handleSavePost = async (postData: Partial<Post> & { id: string; title: string; date: string; content: string }) => {
    try {
      const url = editingPost ? `/api/posts/${editingPost.id}` : "/api/posts";
      const method = editingPost ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success || response.status === 200) {
          alert(
            editingPost
              ? "게시글이 수정되었습니다."
              : "게시글이 추가되었습니다."
          );
          setShowForm(false);
          setEditingPost(null);
          window.location.reload();
        } else {
          alert(`오류: ${result.error || "게시글 저장에 실패했습니다."}`);
        }
      } else {
        let errorMessage = "게시글 저장에 실패했습니다.";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        alert(`오류: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("게시글 저장에 실패했습니다.");
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  // 최신 날짜 찾기 (전체 게시글 기준)
  const getLatestDate = (): string | null => {
    if (allPostsData.length === 0) return null;
    return allPostsData[0].date;
  };

  const latestDate = getLatestDate();
  const subtitle = settings.subtitle || "Software Developer";

  if (isLoading) {
    return (
      <Layout home settings={settings} posts={[]} onCategoryFilter={handleCategoryFilter} selectedCategory={selectedCategory}>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout
      home
      settings={settings}
      posts={allPostsData}
      onCategoryFilter={handleCategoryFilter}
      selectedCategory={selectedCategory}
    >
      {showForm && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
            }}
            onClick={handleCancelForm}
          />
          <PostForm
            post={editingPost}
            onSave={handleSavePost}
            onCancel={handleCancelForm}
          />
        </>
      )}
      <section className={utilStyles.headingMd}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {subtitleHtml ? (
            <div dangerouslySetInnerHTML={{ __html: subtitleHtml }} />
          ) : (
            <p>{subtitle}</p>
          )}
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
          <h2 className={utilStyles.headingLg}>Posts</h2>
          {isAdmin && (
            <button
              onClick={handleAddPost}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                color: "inherit",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              + 게시글 추가
            </button>
          )}
        </div>
        <ul className={utilStyles.list}>
          {filteredPosts.map(({ id, date, title }) => {
            const isNew = latestDate && date === latestDate;
            return (
              <li className={utilStyles.listItem} key={id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1, position: "relative" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Link href={`/posts/${id}`}>{title}</Link>
                      {isNew && (
                        <span
                          className="material-icons"
                          style={{
                            fontSize: "16px",
                            color: "#ff0000",
                            marginLeft: "0.25rem",
                          }}
                          title="최신 게시글"
                        >
                          new_releases
                        </span>
                      )}
                    </div>
                    <small
                      className={utilStyles.lightText}
                      style={{ display: "block", marginTop: "0.25rem" }}
                    >
                      <Date dateString={date} />
                    </small>
                  </div>
                  {isAdmin && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginLeft: "1rem",
                      }}
                    >
                      <button
                        onClick={() => handleEditPost(id)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          backgroundColor: "transparent",
                          color: "inherit",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                        }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePost(id)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          backgroundColor: "transparent",
                          color: "inherit",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      
      {isAdmin && (
        <section className={utilStyles.headingMd}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 className={utilStyles.headingLg}>관리</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => {
                  setShowPlaylistEditor(!showPlaylistEditor);
                  setShowSettingsEditor(false);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "transparent",
                  color: "inherit",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                {showPlaylistEditor ? "플레이리스트 편집 숨기기" : "플레이리스트 편집"}
              </button>
              <button
                onClick={() => {
                  setShowSettingsEditor(!showSettingsEditor);
                  setShowPlaylistEditor(false);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "transparent",
                  color: "inherit",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                {showSettingsEditor ? "설정 편집 숨기기" : "설정 편집"}
              </button>
            </div>
          </div>
          {showPlaylistEditor && <PlaylistEditor />}
          {showSettingsEditor && <SettingsEditor />}
        </section>
      )}
    </Layout>
  );
}


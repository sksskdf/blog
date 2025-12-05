'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAdmin } from "../contexts/admin-contexts";
import { Post, Settings } from "../types";
import { defaultSettings } from "../lib/settings";
import { filterPostsByCategory, getCategoryText } from "../lib/utils/category";
import Layout from "../components/layout";
import Date from "../components/date";
import PostForm from "../components/post-form";
import PlaylistEditor from "../components/playlist-editor";
import SettingsEditor from "../components/settings-editor";

export default function Home() {
  const { isAdmin } = useAdmin();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [allPostsData, setAllPostsData] = useState<Post[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaylistEditor, setShowPlaylistEditor] = useState(false);
  const [showSettingsEditor, setShowSettingsEditor] = useState(false);

  useEffect(() => {

    const loadData = async () => {
      try {

        const postsRes = await fetch("/api/posts", {
          next: { revalidate: 60 },
          cache: "force-cache",
        });

        if (postsRes.ok) {
          const posts = (await postsRes.json()) as Post[];
          setAllPostsData(posts);
          setFilteredPosts(posts);
        }


        setIsLoading(false);


        Promise.all([
          fetch("/api/settings", {
            next: { revalidate: 300 },
            cache: "force-cache",
          }),
          fetch("/api/visitor-stats", { method: "GET" }).catch(() => {

          }),
        ]).then(([settingsRes]) => {
          if (settingsRes.ok) {
            settingsRes.json().then((settingsData: Settings) => {
              setSettings(settingsData);
            });
          } else {
            setSettings(defaultSettings);
          }
        });
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);


  useEffect(() => {
    if (!showSettingsEditor) {
      const reloadSettings = async () => {
        try {
          const response = await fetch("/api/settings", {
            cache: "no-store", // 최신 데이터를 가져오기 위해 캐시 무효화
          });
          if (response.ok) {
            const settingsData = (await response.json()) as Settings;
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
    const filtered = filterPostsByCategory(allPostsData, selectedCategory);
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
        const postData = (await response.json()) as Post;
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

  const handleSavePost = async (
    postData: Partial<Post> & {
      id: string;
      title: string;
      date: string;
      content: string;
    }
  ) => {
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


  const getLatestDate = (): string | null => {
    if (allPostsData.length === 0) return null;
    return allPostsData[0].date;
  };

  const latestDate = getLatestDate();

  if (isLoading || !settings) {
    return (
      <Layout
        home
        settings={null}
        posts={[]}
        onCategoryFilter={handleCategoryFilter}
        selectedCategory={selectedCategory}
      >
        <div className="flex items-end justify-center gap-2 h-[60px] mt-40">
          {[1, 2, 3, 4, 5, 4, 3, 2].map((height, index) => (
            <div
              key={index}
              className="w-2 bg-brand-green rounded-t"
              style={{
                height: `${height * 12}px`,
                animation: `chartBar ${
                  0.6 + index * 0.1
                }s ease-in-out infinite`,
                animationDelay: `${index * 0.1}s`,
              }}
            />
          ))}
        </div>
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
            className="fixed inset-0 bg-black/50 z-[999]"
            onClick={handleCancelForm}
          />
          <PostForm
            post={editingPost}
            onSave={handleSavePost}
            onCancel={handleCancelForm}
          />
        </>
      )}
      <div 
        className="border-t border-dark-border divide-y divide-dark-border"
        style={{ touchAction: "pan-y" }}
      >
        {filteredPosts.map(({ id, date, title, category }) => {
          const isNew = latestDate && date === latestDate;
          const categoryText = getCategoryText(category);

          return (
            <Link
              key={id}
              href={`/posts/${id}`}
              className="block group relative p-6 md:p-8 md:hover:bg-dark-card transition-colors duration-300 cursor-pointer"
              style={{ touchAction: "pan-y" }}
            >
              <article className="relative">
                <div className="flex flex-row items-baseline gap-8 mb-3">
                  <span className="font-mono text-brand-green text-xs tracking-wider shrink-0">
                    <Date dateString={date} />
                  </span>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 border border-dark-border-subtle rounded text-[10px] font-mono text-dark-muted uppercase tracking-widest">
                      {categoryText}
                    </span>
                  </div>
                </div>

                <div className="md:pl-32">
                  <h3 className="text-2xl md:text-4xl font-bold mb-3 leading-tight md:group-hover:text-brand-green transition-colors">
                    {title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs font-mono text-dark-subtle">
                    {isNew && (
                      <span
                        className="inline-flex items-center justify-center text-[0.7rem] font-bold text-dark-card bg-brand-green px-2 py-0.5 rounded-xl leading-tight mr-2"
                        title="최신 게시글"
                      >
                        NEW
                      </span>
                    )}
                  </div>
                </div>

                {!isAdmin && (
                <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-0 -translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-300 text-brand-green z-10">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                )}

                {isAdmin && (
                  <div
                    className="absolute top-6 right-6 md:top-8 md:right-8 flex gap-2 z-20"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditPost(id);
                      }}
                      className="px-2 py-1 bg-transparent text-dark-muted border border-dark-border-subtle rounded cursor-pointer text-xs font-mono transition-all duration-200 hover:border-brand-green hover:text-brand-green"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeletePost(id);
                      }}
                      className="px-2 py-1 bg-transparent text-dark-muted border border-dark-border-subtle rounded cursor-pointer text-xs font-mono transition-all duration-200 hover:border-red-500 hover:text-red-500"
                    >
                      DEL
                    </button>
                  </div>
                )}
              </article>
            </Link>
          );
        })}
      </div>

      {isAdmin && (
        <div className="p-12 border-t border-dark-border flex justify-center">
          <button
            onClick={handleAddPost}
            className="px-8 py-3 border border-dark-border-subtle hover:border-brand-green hover:text-brand-green transition-colors font-mono text-sm uppercase tracking-widest bg-transparent text-dark-muted cursor-pointer"
          >
            + Add Post
          </button>
        </div>
      )}

      {isAdmin && (
        <section className="text-lg text-dark-text p-8 md:p-12 border-t border-dark-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-dark-text">관리</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPlaylistEditor(!showPlaylistEditor);
                  setShowSettingsEditor(false);
                }}
                className="px-4 py-2 bg-transparent text-dark-text border border-dark-border-subtle rounded cursor-pointer text-sm font-mono transition-all duration-200 hover:border-brand-green hover:text-brand-green"
              >
                {showPlaylistEditor
                  ? "플레이리스트 편집 숨기기"
                  : "플레이리스트 편집"}
              </button>
              <button
                onClick={() => {
                  setShowSettingsEditor(!showSettingsEditor);
                  setShowPlaylistEditor(false);
                }}
                className="px-4 py-2 bg-transparent text-dark-text border border-dark-border-subtle rounded cursor-pointer text-sm font-mono transition-all duration-200 hover:border-brand-green hover:text-brand-green"
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


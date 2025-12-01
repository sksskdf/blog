import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import PostForm from "../components/post-form";
import Date from "../components/date";
import Layout from "../components/layout";
import { useAdmin } from "../contexts/admin-contexts";
import { getSortedPostsData } from "../lib/posts";
import { getSettings } from "../lib/settings";
import { incrementVisitorCount } from "../lib/visitor-stats";
import utilStyles from "../styles/utils.module.css";

export async function getServerSideProps() {
  // 방문자수 자동 증가
  try {
    await incrementVisitorCount();
  } catch (error) {
    console.error("Error incrementing visitor count:", error);
  }

  const allPostsData = await getSortedPostsData();
  const settings = getSettings();
  return {
    props: {
      allPostsData,
      settings,
    },
  };
}

export default function Home({ allPostsData, settings: initialSettings }) {
  const { isAdmin } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [settings, setSettings] = useState(
    initialSettings || { subtitle: "Software Developer" }
  );

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleAddPost = () => {
    setEditingPost(null);
    setShowForm(true);
  };

  const handleEditPost = async (id) => {
    try {
      const response = await fetch(`/api/posts/${id}`);
      if (response.ok) {
        const postData = await response.json();
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

  const handleDeletePost = async (id) => {
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

  const handleSavePost = async (postData) => {
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
        alert(
          editingPost ? "게시글이 수정되었습니다." : "게시글이 추가되었습니다."
        );
        setShowForm(false);
        setEditingPost(null);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error || "게시글 저장에 실패했습니다."}`);
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

  const subtitle = settings.subtitle || "Software Developer";
  const siteTitle = settings.siteTitle || "HARRY'S BLOG";

  return (
    <Layout home settings={settings}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
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
          <p>{subtitle}</p>
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
          {allPostsData.map(({ id, date, title }) => (
            <li className={utilStyles.listItem} key={id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Link href={`/posts/${id}`}>{title}</Link>
                  <br />
                  <small className={utilStyles.lightText}>
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
          ))}
        </ul>
      </section>
    </Layout>
  );
}

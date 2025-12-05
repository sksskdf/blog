"use client";

import { useEffect, useState, FormEvent, KeyboardEvent } from "react";
import { useAdmin } from "../contexts/admin-contexts";

export default function AdminModeHandler() {
  const { isAdmin, toggleAdmin } = useAdmin();
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // hotkeys-js 동적 import
    let hotkeys: typeof import("hotkeys-js").default | undefined;
    const loadHotkeys = async () => {
      try {
        hotkeys = (await import("hotkeys-js")).default;

        // Ctrl + Shift + ` (백틱) 핫키 설정
        hotkeys("ctrl+shift+`", (event) => {
          event.preventDefault();
          // 관리자 모드가 이미 켜져있으면 비밀번호 없이 바로 해제
          if (isAdmin) {
            toggleAdmin();
          } else {
            // 관리자 모드가 꺼져있으면 비밀번호 요구
            setShowPasswordModal(true);
            setPassword("");
            setError("");
          }
        });
      } catch (error) {
        // Hotkeys library failed to load
      }
    };

    loadHotkeys();

    // 클린업 함수
    return () => {
      if (hotkeys) {
        hotkeys.unbind("ctrl+shift+`");
      }
    };
  }, [isAdmin, toggleAdmin]);

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/admin-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        toggleAdmin();
        setShowPasswordModal(false);
        setPassword("");
        setError("");
      } else {
        const data = (await response.json()) as { error?: string };
        setError(data.error || "비밀번호가 올바르지 않습니다.");
        setPassword("");
      }
    } catch (err) {
      // Admin verification failed
      setError("비밀번호 검증 중 문제가 발생했습니다.");
      setPassword("");
    }
  };

  const handleCancel = () => {
    setShowPasswordModal(false);
    setPassword("");
    setError("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!showPasswordModal) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center"
        onClick={handleCancel}
      >
        <div
          className="bg-dark-card border border-dark-border rounded-lg shadow-lg min-w-[300px] max-w-[400px] p-8"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          <h2 className="text-xl font-bold mb-4 text-dark-text font-mono">
            admin_mode
          </h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoFocus
                className={`w-full px-3 py-2 bg-dark-bg border ${
                  error
                    ? "border-red-500 focus:border-red-500"
                    : "border-dark-border-subtle focus:border-brand-green"
                } rounded text-dark-text font-mono text-sm outline-none transition-colors`}
              />
              {error && (
                <p className="text-red-500 mt-2 text-sm font-mono">{error}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-transparent border border-dark-border-subtle rounded cursor-pointer text-sm font-mono text-dark-muted transition-all duration-200 hover:border-dark-border hover:text-dark-text"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-green text-dark-card border border-brand-green rounded cursor-pointer text-sm font-mono transition-all duration-200 hover:bg-brand-accent"
              >
                확인
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

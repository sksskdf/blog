'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { remark } from 'remark';
import html from 'remark-html';
import styles from './settings-editor.module.css';
import { Settings } from '../types';
import { defaultSettings } from '../lib/settings';

export default function SettingsEditor() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // description을 마크다운으로 파싱
    if (!settings) return;

    const parseDescription = async () => {
      if (settings.description) {
        try {
          const processed = await remark()
            .use(html)
            .process(settings.description);
          setDescriptionHtml(processed.toString());
        } catch (error) {
          console.error("Error parsing description:", error);
          setDescriptionHtml(settings.description);
        }
      } else {
        setDescriptionHtml("");
      }
    };
    parseDescription();
  }, [settings?.description]);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = (await response.json()) as Settings;
        setSettings(data);
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!settings) return;

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("설정이 저장되었습니다.");
        loadSettings();
      } else {
        const error = (await response.json()) as { error?: string };
        alert(`오류: ${error.error || "설정 저장에 실패했습니다."}`);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("설정 저장에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-end justify-center gap-2 h-[60px] mt-8">
        {[1, 2, 3, 4, 5, 4, 3, 2].map((height, index) => (
          <div
            key={index}
            className="w-2 bg-brand-green rounded-t"
            style={{
              height: `${height * 12}px`,
              animation: `chartBar ${0.6 + index * 0.1}s ease-in-out infinite`,
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className={styles.editorContainer}>
      <form onSubmit={handleSubmit} className={styles.editorForm}>
        <div className={styles.formRow}>
          <label>
            이름
            <input
              type="text"
              value={settings.name || ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSettings({ ...settings, name: e.target.value })
              }
            />
          </label>
          <label>
            사이트 제목
            <input
              type="text"
              value={settings.siteTitle || ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSettings({ ...settings, siteTitle: e.target.value })
              }
            />
          </label>
        </div>
        <div className={styles.formRow}>
          <label>
            부제목 (마크다운 지원)
            <textarea
              value={settings.subtitle || ""}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setSettings({ ...settings, subtitle: e.target.value })
              }
              rows={3}
              placeholder="예: Programmer 또는 [링크 텍스트](https://example.com)"
            />
          </label>
        </div>
        <div className={styles.formRow}>
          <label>
            설명 (마크다운 지원)
            <textarea
              value={settings.description || ""}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setSettings({ ...settings, description: e.target.value })
              }
              rows={5}
              placeholder="사이트 설명을 마크다운 형식으로 입력하세요..."
            />
          </label>
        </div>
        {descriptionHtml && (
          <div className={styles.preview}>
            <h4>설명 미리보기:</h4>
            <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
          </div>
        )}
        <div className={styles.formActions}>
          <button type="submit" className={styles.saveButton}>
            저장
          </button>
        </div>
      </form>
    </div>
  );
}


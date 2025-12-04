import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { remark } from 'remark';
import html from 'remark-html';
import { Post } from '../types';

interface PostFormProps {
  post: Post | null;
  onSave: (postData: { id: string; title: string; date: string; category: string | null; content: string }) => void;
  onCancel: () => void;
}

export default function PostForm({ post, onSave, onCancel }: PostFormProps) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    date: '',
    category: '',
    content: '',
  });
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post) {
      // 카테고리가 배열인 경우 쉼표로 구분된 문자열로 변환
      let categoryStr = '';
      if (post.category) {
        if (Array.isArray(post.category)) {
          categoryStr = post.category.join(', ');
        } else {
          categoryStr = post.category;
        }
      }
      setFormData({
        id: post.id || '',
        title: post.title || '',
        date: post.date || '',
        category: categoryStr,
        content: post.content || '',
      });
    } else {
      // 새 게시글인 경우 기본값 설정
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        id: '',
        title: '',
        date: today,
        category: '',
        content: '',
      });
    }
  }, [post]);

  useEffect(() => {
    // 마크다운을 HTML로 변환하여 프리뷰 업데이트 (실시간)
    const updatePreview = async () => {
      if (formData.content) {
        try {
          const processedContent = await remark()
            .use(html)
            .process(formData.content);
          setPreviewHtml(processedContent.toString());
        } catch (error) {
          console.error('Error processing markdown:', error);
          setPreviewHtml('');
        }
      } else {
        setPreviewHtml('');
      }
    };

    updatePreview();
  }, [formData.content]);

  // 스크롤 동기화
  useEffect(() => {
    const editor = editorRef.current;
    const preview = previewRef.current;
    
    if (editor && preview) {
      const handleScroll = () => {
        const scrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
        preview.scrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight);
      };

      editor.addEventListener('scroll', handleScroll);
      return () => editor.removeEventListener('scroll', handleScroll);
    }
  }, [formData.content]);

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      content: e.target.value,
    }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // ID가 없으면 제목에서 생성
    let postId = formData.id;
    if (!postId && formData.title) {
      postId = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (!postId || !formData.title || !formData.date || !formData.content) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    onSave({
      id: postId,
      title: formData.title,
      date: formData.date,
      category: formData.category || null,
      content: formData.content,
    });
  };

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-card border border-dark-border rounded-lg shadow-lg z-[1000] w-[90%] max-w-[1200px] max-h-[90vh] flex flex-col">
      <div className="p-6 border-b border-dark-border">
        <h2 className="m-0 text-xl font-bold text-dark-text font-mono">
          {post ? '게시글 수정' : '새 게시글 추가'}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="p-6 border-b border-dark-border grid grid-cols-1 md:grid-cols-2 gap-4">
          {!post && (
            <div>
              <label className="block mb-2 text-sm font-mono text-dark-muted font-medium">
                ID (자동 생성되거나 수동 입력):
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                placeholder="자동 생성됨"
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border-subtle rounded text-dark-text font-mono text-sm outline-none focus:border-brand-green transition-colors"
              />
            </div>
          )}
          <div>
            <label className="block mb-2 text-sm font-mono text-dark-muted font-medium">
              제목:
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border-subtle rounded text-dark-text font-mono text-sm outline-none focus:border-brand-green transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-mono text-dark-muted font-medium">
              날짜:
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border-subtle rounded text-dark-text font-mono text-sm outline-none focus:border-brand-green transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-mono text-dark-muted font-medium">
              카테고리 (쉼표로 구분):
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="예: 개발, 블로그, 일기 (쉼표로 구분)"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border-subtle rounded text-dark-text font-mono text-sm outline-none focus:border-brand-green transition-colors"
            />
            <small className="text-xs text-dark-subtle mt-1 block font-mono">
              여러 태그를 쉼표로 구분하여 입력하세요
            </small>
          </div>
        </div>

        {/* 에디터와 프리뷰 동시 동작 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 에디터 영역 */}
          <div className="flex-1 flex flex-col border-r border-dark-border">
            <div className="px-3 py-2 bg-dark-gray border-b border-dark-border text-sm font-mono font-medium text-dark-text">
              편집
            </div>
            <textarea
              ref={editorRef}
              name="content"
              value={formData.content}
              onChange={handleContentChange}
              required
              placeholder="마크다운을 입력하세요..."
              className="flex-1 w-full p-4 border-none outline-none font-mono text-sm leading-relaxed resize-none bg-dark-bg text-dark-text"
            />
          </div>

          {/* 프리뷰 영역 - 실시간 업데이트 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 bg-dark-gray border-b border-dark-border text-sm font-mono font-medium text-dark-text">
              프리뷰
            </div>
            <div
              ref={previewRef}
              className="flex-1 p-4 overflow-y-auto text-sm leading-relaxed text-dark-text bg-dark-bg"
              dangerouslySetInnerHTML={{
                __html:
                  previewHtml ||
                  '<p style="color: #999; margin: 0;">마크다운을 입력하면 프리뷰가 실시간으로 표시됩니다...</p>',
              }}
            />
          </div>
        </div>

        <div className="p-4 border-t border-dark-border flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-dark-border-subtle rounded bg-transparent cursor-pointer text-sm font-mono text-dark-muted transition-all duration-200 hover:border-dark-border hover:text-dark-text"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 border-none rounded bg-brand-green text-dark-card cursor-pointer text-sm font-mono transition-all duration-200 hover:bg-brand-accent"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}


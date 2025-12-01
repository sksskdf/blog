import { useState, useEffect, useRef } from 'react';
import { remark } from 'remark';
import html from 'remark-html';

export default function PostForm({ post, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    date: '',
    category: '',
    content: '',
  });
  const [previewHtml, setPreviewHtml] = useState('');
  const editorRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    if (post) {
      setFormData({
        id: post.id || '',
        title: post.title || '',
        date: post.date || '',
        category: post.category || '',
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

  const handleContentChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      content: e.target.value,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
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
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      width: '90%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
        <h2 style={{ margin: 0 }}>{post ? '게시글 수정' : '새 게시글 추가'}</h2>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e0e0e0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {!post && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                ID (자동 생성되거나 수동 입력):
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                placeholder="자동 생성됨"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              제목:
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              날짜:
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              카테고리:
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="카테고리 (선택사항)"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        {/* 에디터와 프리뷰 동시 동작 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 에디터 영역 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', fontSize: '0.875rem', fontWeight: '500' }}>
              편집
            </div>
            <textarea
              ref={editorRef}
              name="content"
              value={formData.content}
              onChange={handleContentChange}
              required
              placeholder="마크다운을 입력하세요..."
              style={{
                flex: 1,
                width: '100%',
                padding: '1rem',
                border: 'none',
                outline: 'none',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                resize: 'none',
              }}
            />
          </div>

          {/* 프리뷰 영역 - 실시간 업데이트 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', fontSize: '0.875rem', fontWeight: '500' }}>
              프리뷰
            </div>
            <div
              ref={previewRef}
              style={{
                flex: 1,
                padding: '1rem',
                overflowY: 'auto',
                fontSize: '0.875rem',
                lineHeight: '1.6',
              }}
              dangerouslySetInnerHTML={{ 
                __html: previewHtml || '<p style="color: #999; margin: 0;">마크다운을 입력하면 프리뷰가 실시간으로 표시됩니다...</p>' 
              }}
            />
          </div>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            취소
          </button>
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#0070f3',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}


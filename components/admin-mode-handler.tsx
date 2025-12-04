import { useEffect, useState, FormEvent, KeyboardEvent } from 'react';
import { useAdmin } from '../contexts/admin-contexts';

export default function AdminModeHandler() {
  const { isAdmin, toggleAdmin } = useAdmin();
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // hotkeys-js 동적 import
    let hotkeys: typeof import('hotkeys-js').default | undefined;
    const loadHotkeys = async () => {
      try {
        hotkeys = (await import('hotkeys-js')).default;
        
        // Ctrl + Shift + ` (백틱) 핫키 설정
        hotkeys('ctrl+shift+`', (event) => {
          event.preventDefault();
          // 관리자 모드가 이미 켜져있으면 비밀번호 없이 바로 해제
          if (isAdmin) {
            toggleAdmin();
          } else {
            // 관리자 모드가 꺼져있으면 비밀번호 요구
            setShowPasswordModal(true);
            setPassword('');
            setError('');
          }
        });
      } catch (error) {
        console.error('Failed to load hotkeys-js:', error);
      }
    };

    loadHotkeys();

    // 클린업 함수
    return () => {
      if (hotkeys) {
        hotkeys.unbind('ctrl+shift+`');
      }
    };
  }, [isAdmin, toggleAdmin]);

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        toggleAdmin();
        setShowPasswordModal(false);
        setPassword('');
        setError('');
      } else {
        const data = await response.json() as { error?: string };
        setError(data.error || '비밀번호가 올바르지 않습니다.');
        setPassword('');
      }
    } catch (err) {
      console.error('Failed to verify admin password:', err);
      setError('비밀번호 검증 중 문제가 발생했습니다.');
      setPassword('');
    }
  };

  const handleCancel = () => {
    setShowPasswordModal(false);
    setPassword('');
    setError('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!showPasswordModal) {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={handleCancel}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '300px',
            maxWidth: '400px',
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: error ? '2px solid #dc3545' : '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
              {error && (
                <p style={{ color: '#dc3545', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                  {error}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
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
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
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


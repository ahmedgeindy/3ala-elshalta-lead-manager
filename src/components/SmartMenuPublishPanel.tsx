import { useState, useCallback } from 'react';
import { Copy, ArrowSquareOut, SpinnerGap, Warning, Check, Key, ArrowClockwise, PencilSimple } from '@phosphor-icons/react';

interface SmartMenuPublishPanelProps {
  publishedUrl: string | null;
  publishing: boolean;
  error: string | null;
  onPublish: () => void;
  onUpdate: () => void;
  isExisting: boolean;
  imageUrls: string[];
  onRetry?: () => void;
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '0.02em',
};

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  borderRadius: 'var(--radius-md)',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'all 0.2s',
};

const primaryBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: 'var(--accent)',
  color: '#fff',
};

const linkRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 10px',
  fontSize: 12,
  color: 'var(--accent)',
  fontFamily: 'var(--font-mono)',
  wordBreak: 'break-all',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 4,
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.15s',
};

export function SmartMenuPublishPanel({
  publishedUrl,
  publishing,
  error,
  onPublish,
  onUpdate,
  isExisting,
  imageUrls,
  onRetry,
}: SmartMenuPublishPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!publishedUrl) return;
    const full = window.location.origin + publishedUrl;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [publishedUrl]);

  const handleOpen = useCallback(() => {
    if (!publishedUrl) return;
    window.open(publishedUrl, '_blank');
  }, [publishedUrl]);

  const showNoImagesWarning = imageUrls.length === 0 && !publishing;

  return (
    <div className="flex flex-col gap-4">
      <span style={sectionHeaderStyle}>نشر</span>

      {error && (() => {
        const isAuthError = error.toLowerCase().includes('authentication');
        const isSlugError = error.toLowerCase().includes('slug is already in use');
        return (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            fontSize: 12,
            color: '#f87171',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            lineHeight: 1.4,
          }}>
            {isAuthError ? (
              <Key size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            ) : isSlugError ? (
              <PencilSimple size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <Warning size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <span style={{ flex: 1 }}>
              {error}
              {isAuthError && (
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  تأكد من إعدادات API القائمة الذكية.
                </span>
              )}
              {isSlugError && (
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  قم بتعديل الرابط المختصر أعلاه وحاول مرة أخرى.
                </span>
              )}
            </span>
            {!isAuthError && !isSlugError && onRetry && (
              <button
                onClick={onRetry}
                style={{
                  background: 'none',
                  border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#f87171',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '2px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <ArrowClockwise size={12} />
                حاول مرة أخرى
              </button>
            )}
          </div>
        );
      })()}

      {showNoImagesWarning && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          fontSize: 11,
          color: 'var(--text-secondary)',
          background: 'rgba(250,204,21,0.06)',
          border: '1px solid rgba(250,204,21,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 10px',
          lineHeight: 1.4,
        }}>
          <Warning size={14} style={{ flexShrink: 0, color: '#facc15', marginTop: 1 }} />
          لم يتم إضافة أي صور للقائمة. إضافة الصور يزيد من الثقة.
        </div>
      )}

      <button
        onClick={isExisting ? onUpdate : onPublish}
        disabled={publishing}
        style={{
          ...primaryBtnStyle,
          opacity: publishing ? 0.6 : 1,
          cursor: publishing ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!publishing) e.currentTarget.style.background = 'var(--accent-hover, var(--accent))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent)';
        }}
      >
        {publishing ? (
          <>
            <SpinnerGap size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            {isExisting ? 'جاري التحديث…' : 'جاري النشر…'}
          </>
        ) : isExisting ? 'تحديث' : 'نشر'}
      </button>

      {publishedUrl && (
        <div className="flex flex-col gap-2">
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            الرابط المنشور
          </span>
          <div style={linkRowStyle}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', direction: 'ltr', textAlign: 'left' }}>
              {publishedUrl}
            </span>
            <button onClick={handleCopy} style={iconBtnStyle} title="نسخ الرابط">
              {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
            </button>
            <button onClick={handleOpen} style={iconBtnStyle} title="فتح في علامة تبويب جديدة">
              <ArrowSquareOut size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
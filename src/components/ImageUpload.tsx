import { useState, useRef, useCallback } from 'react';
import { Image, X, SpinnerGap, Warning } from '@phosphor-icons/react';
import { uploadImage } from '../lib/uploadImage';

interface Props {
  imageUrl: string;
  onChangeUrl: (url: string) => void;
}

export function ImageUpload({ imageUrl, onChangeUrl }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);

    const result = await uploadImage(file);

    if ('url' in result && result.url) {
      onChangeUrl(result.url);
    } else {
      setError(result.error ?? 'Upload failed');
    }

    setUploading(false);
  }, [onChangeUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) handleFile(file);
        return;
      }
    }
  }, [handleFile]);

  const clear = () => {
    onChangeUrl('');
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2" onPaste={handlePaste}>
      <label style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        Offer Image
      </label>

      {!imageUrl && !uploading ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            display: 'block',
            borderRadius: 'var(--radius-md)',
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-medium)'}`,
            background: dragging ? 'var(--accent-muted)' : 'rgba(255,255,255,0.03)',
            padding: '20px 16px',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
            textAlign: 'center',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />
          <Image size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>
            Drop menu image here
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            or click to browse · JPEG, PNG, WebP · max 10MB
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, opacity: 0.6 }}>
            You can also paste from clipboard
          </div>
        </label>
      ) : uploading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '24px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <SpinnerGap size={20} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Uploading & compressing...</span>
        </div>
      ) : (
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-medium)',
        }}>
          <img
            src={imageUrl}
            alt="Offer"
            style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'cover' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <button
            onClick={clear}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(233,69,96,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
          >
            <X size={12} style={{ color: '#fff' }} />
          </button>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '4px 8px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            fontSize: 9,
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'var(--font-mono)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            direction: 'ltr',
          }}>
            {imageUrl}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#f87171',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
        }}>
          <Warning size={13} />
          {error}
        </div>
      )}

      {!imageUrl && !uploading && !error && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 10,
              padding: '2px 4px',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Or paste an image URL instead
          </button>
        </div>
      )}
    </div>
  );
}
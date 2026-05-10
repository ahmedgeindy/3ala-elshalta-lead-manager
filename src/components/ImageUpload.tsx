import { useState, useRef, useCallback } from 'react';
import { Image, X, SpinnerGap, Warning } from '@phosphor-icons/react';
import { uploadImage } from '../lib/uploadImage';

const MAX_IMAGES = 5;

interface Props {
  imageUrls: string[];
  onChangeUrls: (urls: string[]) => void;
}

interface UploadSlot {
  id: string;
  url?: string;
  uploading: boolean;
  error?: string;
}

export function ImageUpload({ imageUrls, onChangeUrls }: Props) {
  const [dragging, setDragging] = useState(false);
  const [slots, setSlots] = useState<UploadSlot[]>(() =>
    imageUrls.map((url, i) => ({ id: `init-${i}`, url, uploading: false }))
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCount = slots.filter(s => s.url || s.uploading).length;
  const canAddMore = activeCount < MAX_IMAGES;

  const handleFiles = useCallback(async (files: File[]) => {
    const remaining = MAX_IMAGES - slots.filter(s => s.url || s.uploading).length;
    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) return;

    const newSlots: UploadSlot[] = toUpload.map((_, i) => ({
      id: `upload-${Date.now()}-${i}`,
      uploading: true,
    }));

    setSlots(prev => [...prev, ...newSlots]);

    const results = await Promise.all(
      toUpload.map(async (file, i) => {
        const result = await uploadImage(file);
        return { slotId: newSlots[i].id, result };
      })
    );

    setSlots(prev => {
      const next = prev.map(slot => {
        const r = results.find(x => x.slotId === slot.id);
        if (!r) return slot;
        if ('url' in r.result && r.result.url) {
          return { ...slot, url: r.result.url, uploading: false };
        }
        return { ...slot, uploading: false, error: r.result.error ?? 'Upload failed' };
      });
      onChangeUrls(next.filter(s => s.url).map(s => s.url!));
      return next;
    });
  }, [slots, onChangeUrls]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  }, [handleFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const files: File[] = [];
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      if (e.clipboardData.items[i].type.startsWith('image/')) {
        const f = e.clipboardData.items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) handleFiles(files);
  }, [handleFiles]);

  const removeSlot = (id: string) => {
    setSlots(prev => {
      const next = prev.filter(s => s.id !== id);
      onChangeUrls(next.filter(s => s.url).map(s => s.url!));
      return next;
    });
  };

  const activeSlots = slots.filter(s => s.url || s.uploading || s.error);

  return (
    <div className="flex flex-col gap-2" onPaste={handlePaste}>
      <label style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        Offer Images{activeSlots.length > 0 && <span style={{ color: 'var(--text-secondary)' }}> ({activeSlots.length}/{MAX_IMAGES})</span>}
      </label>

      {/* Thumbnail grid */}
      {activeSlots.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 6 }}>
          {activeSlots.map(slot => (
            <div
              key={slot.id}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: slot.error
                  ? '1px solid rgba(248,113,113,0.4)'
                  : '1px solid var(--border-medium)',
                background: 'rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {slot.uploading ? (
                <>
                  <SpinnerGap size={20} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </>
              ) : slot.error ? (
                <Warning size={18} style={{ color: '#f87171' }} />
              ) : slot.url ? (
                <img
                  src={slot.url}
                  alt="Offer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}

              {!slot.uploading && (
                <button
                  onClick={() => removeSlot(slot.id)}
                  style={{
                    position: 'absolute', top: 3, right: 3,
                    background: 'rgba(0,0,0,0.65)',
                    border: 'none', borderRadius: '50%',
                    width: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(233,69,96,0.85)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.65)')}
                >
                  <X size={10} style={{ color: '#fff' }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone — hidden when at max */}
      {canAddMore && (
        <label
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            display: 'block',
            borderRadius: 'var(--radius-md)',
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-medium)'}`,
            background: dragging ? 'var(--accent-muted)' : 'rgba(255,255,255,0.03)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
            textAlign: 'center',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
            onChange={e => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) handleFiles(files);
              e.target.value = '';
            }}
          />
          <Image size={22} style={{ color: 'var(--text-muted)', margin: '0 auto 6px' }} />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 2 }}>
            Drop images here or click to browse
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Up to {MAX_IMAGES} images · JPEG, PNG, WebP · max 10MB each
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, opacity: 0.6 }}>
            You can also paste from clipboard
          </div>
        </label>
      )}

      {/* Per-slot error messages */}
      {slots.filter(s => s.error).map(slot => (
        <div
          key={slot.id + '-err'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: '#f87171',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
          }}
        >
          <Warning size={13} />
          {slot.error}
        </div>
      ))}
    </div>
  );
}
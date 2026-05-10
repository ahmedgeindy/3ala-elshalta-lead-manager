import { useState, useCallback } from 'react';

interface SmartMenuGalleryProps {
  imageUrls: string[];
}

export default function SmartMenuGallery({ imageUrls }: SmartMenuGalleryProps) {
  const [hidden, setHidden] = useState<Set<number>>(new Set());

  const handleError = useCallback((index: number) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  if (imageUrls.length === 0) return null;

  const visibleUrls = imageUrls.filter((_, i) => !hidden.has(i));

  if (visibleUrls.length === 0) return null;

  const isSingle = visibleUrls.length === 1;

  return (
    <div
      className="smart-menu-gallery"
      style={{
        display: 'grid',
        gridTemplateColumns: isSingle ? '1fr' : 'repeat(2, 1fr)',
        gap: 12,
      }}
    >
      {imageUrls.map((url, i) => {
        if (hidden.has(i)) return null;
        return (
          <img
            key={i}
            src={url}
            alt=""
            loading="lazy"
            style={{
              width: '100%',
              aspectRatio: isSingle ? undefined : '1',
              borderRadius: isSingle ? 'var(--radius-md)' : 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={() => handleError(i)}
          />
        );
      })}
      <style>{`
        @media (min-width: 768px) {
          .smart-menu-gallery {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
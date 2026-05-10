import { useState, useCallback } from 'react';
import type { SmartMenuPage } from '../types';
import { validateSlug, generateSlug } from '../lib/slugUtils';
import { ImageUpload } from './ImageUpload';
import { Warning } from '@phosphor-icons/react';

interface SmartMenuEditorProps {
  page: Partial<SmartMenuPage>;
  onChange: (page: Partial<SmartMenuPage>) => void;
  error: string | null;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 14px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 72,
  resize: 'vertical',
  lineHeight: 1.5,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--text-muted)',
  letterSpacing: '0.02em',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '0.02em',
};

const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'var(--accent)';
  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
  e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent), inset 0 1px 2px rgba(0,0,0,0.2)';
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
  e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.2)';
};

export function SmartMenuEditor({ page, onChange, error }: SmartMenuEditorProps) {
  const [slugError, setSlugError] = useState<string | null>(null);

  const handleChange = useCallback(
    (field: keyof SmartMenuPage, value: string | boolean | string[]) => {
      const next = { ...page, [field]: value };
      if (field === 'campaignName' && !page.slug) {
        const auto = generateSlug(value as string);
        if (auto) {
          next.slug = auto;
          setSlugError(null);
        }
      }
      onChange(next);
    },
    [page, onChange],
  );

  const handleSlugBlur = useCallback(() => {
    const result = validateSlug(page.slug ?? '');
    setSlugError(result.valid ? null : result.error ?? null);
  }, [page.slug]);

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange({ ...page, slug: val });
      if (slugError) {
        const result = validateSlug(val);
        if (result.valid) setSlugError(null);
      }
    },
    [page, onChange, slugError],
  );

  return (
    <div className="flex flex-col gap-4">
      <span style={sectionHeaderStyle}>Smart Menu Editor</span>

      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Campaign Name</label>
        <input
          type="text"
          value={page.campaignName ?? ''}
          placeholder="e.g. Summer Offer"
          style={inputStyle}
          onChange={(e) => handleChange('campaignName', e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Slug</label>
        <input
          type="text"
          value={page.slug ?? ''}
          placeholder="e.g. summer-offer"
          style={{
            ...inputStyle,
            borderColor: slugError ? 'rgba(248,113,113,0.5)' : undefined,
          }}
          onChange={handleSlugChange}
          onFocus={handleFocus}
          onBlur={(e) => {
            handleBlur(e);
            handleSlugBlur();
          }}
        />
        {slugError && (
          <span style={{ fontSize: 11, color: '#f87171', marginTop: -4 }}>
            {slugError}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Page Title</label>
        <input
          type="text"
          value={page.title ?? ''}
          placeholder="e.g. Ramadan Special Menu"
          style={inputStyle}
          onChange={(e) => handleChange('title', e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label style={{ ...labelStyle, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          Offer Headline
        </label>
        <input
          type="text"
          value={page.offerHeadline ?? ''}
          placeholder="e.g. 25% Off All Meals"
          style={{ ...inputStyle, fontSize: 15, fontWeight: 600 }}
          onChange={(e) => handleChange('offerHeadline', e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Offer Description</label>
        <textarea
          value={page.offerDescription ?? ''}
          placeholder="Describe the offer details..."
          style={textareaStyle}
          onChange={(e) => handleChange('offerDescription', e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <ImageUpload
        imageUrls={page.imageUrls ?? []}
        onChangeUrls={(urls) => handleChange('imageUrls', urls)}
      />

      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Order Phone Number</label>
        <input
          type="tel"
          value={page.orderPhone ?? ''}
          placeholder="e.g. +966512345678"
          style={inputStyle}
          onChange={(e) => handleChange('orderPhone', e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label style={labelStyle}>WhatsApp CTA Message</label>
        <textarea
          value={page.orderMessage ?? ''}
          placeholder="Pre-filled message when customers tap Order on WhatsApp..."
          style={textareaStyle}
          onChange={(e) => handleChange('orderMessage', e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div className="flex items-center gap-3" style={{ marginTop: 4 }}>
        <label style={{
          position: 'relative',
          display: 'inline-block',
          width: 40,
          height: 22,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={page.isActive ?? true}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          />
          <span style={{
            position: 'absolute',
            inset: 0,
            background: page.isActive !== false ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
            borderRadius: 11,
            transition: 'background 0.2s',
          }} />
          <span style={{
            position: 'absolute',
            top: 2,
            left: page.isActive !== false ? 20 : 2,
            width: 18,
            height: 18,
            background: '#fff',
            borderRadius: '50%',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </label>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {page.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      </div>

      {error && (
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
          <Warning size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}
    </div>
  );
}
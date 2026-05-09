import { useRef } from 'react';
import {
  TextB, TextItalic, TextStrikethrough, Code,
} from '@phosphor-icons/react';
import type { Lead, Campaign } from '../types';
import { buildMessage } from '../lib/buildMessage';
import { formatWhatsApp } from '../lib/formatWhatsApp';
import { ImageUpload } from './ImageUpload';

interface Props {
  template: string;
  onChange: (t: string) => void;
  previewLead: Lead | null;
  campaign: Campaign;
  onChangeCampaign: (c: Campaign) => void;
}

const VARS = ['{{name}}', '{{discount}}', '{{duration}}', '{{url}}'];
const EMOJIS = ['🔥', '🎉', '🎁', '✨', '💪', '👋', '💡', '🏆', '💰', '⏰', '📞', '🚀', '❤️', '👍', '🎯', '📢'];

type FormatAction = 'bold' | 'italic' | 'strike' | 'mono';
const FORMAT_MARKS: Record<FormatAction, { prefix: string; suffix: string }> = {
  bold:   { prefix: '*', suffix: '*' },
  italic: { prefix: '_', suffix: '_' },
  strike: { prefix: '~', suffix: '~' },
  mono:   { prefix: '```', suffix: '```' },
};

export function MessageBuilder({ template, onChange, previewLead, campaign, onChangeCampaign }: Props) {
  const preview = previewLead ? buildMessage(template, previewLead, campaign) : null;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(template + text);
      return;
    }
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    const next = template.slice(0, start) + text + template.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + text.length;
      el.focus();
    });
  };

  const insertVar = (v: string) => insertAtCursor(v);

  const handleFormat = (action: FormatAction) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const mark = FORMAT_MARKS[action];
    const selected = template.slice(start, end);
    const next = template.slice(0, start) + mark.prefix + selected + mark.suffix + template.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = start + mark.prefix.length;
      el.selectionEnd = start + mark.prefix.length + selected.length;
      el.focus();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="label" style={{ color: 'var(--accent)' }}>
        Message Template
      </span>

      {/* Format toolbar */}
      <div className="flex items-center gap-1">
        {([
          { action: 'bold' as FormatAction, icon: TextB, label: 'Bold *text*' },
          { action: 'italic' as FormatAction, icon: TextItalic, label: 'Italic _text_' },
          { action: 'strike' as FormatAction, icon: TextStrikethrough, label: 'Strikethrough ~text~' },
          { action: 'mono' as FormatAction, icon: Code, label: 'Monospace ```text```' },
        ] as const).map(({ action, icon: Icon, label }) => (
          <button
            key={action}
            onClick={() => handleFormat(action)}
            title={label}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
              fontSize: 14,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-muted)';
              e.currentTarget.style.borderColor = 'var(--accent-border)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id="msg-template"
        value={template}
        onChange={(e) => onChange(e.target.value)}
        dir="rtl"
        rows={5}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          fontSize: 12,
          color: 'var(--text-primary)',
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.7,
          resize: 'vertical',
          transition: 'border-color var(--transition-fast), background var(--transition-fast)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-border)';
          e.currentTarget.style.background = 'var(--accent-muted)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-medium)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }}
      />

      {/* Emoji row */}
      <div className="flex flex-wrap gap-1" style={{ marginTop: -4 }}>
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => insertAtCursor(emoji)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: '3px 5px',
              fontSize: 13,
              cursor: 'pointer',
              lineHeight: 1,
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Variable chips */}
      <div className="flex flex-wrap gap-1">
        {VARS.map(v => (
          <button
            key={v}
            onClick={() => insertVar(v)}
            style={{
              background: 'var(--pending-muted)',
              border: `1px solid var(--pending-border)`,
              borderRadius: 5,
              padding: '3px 8px',
              fontSize: 10,
              color: 'var(--pending)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pending-border)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--pending-muted)')}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Image upload */}
      <ImageUpload
        imageUrl={campaign.imageUrl}
        onChangeUrl={(url) => onChangeCampaign({ ...campaign, imageUrl: url })}
      />

      {/* WhatsApp-style preview */}
      {preview && (
        <div style={{
          background: '#0b141a',
          border: '1px solid rgba(37,211,102,0.2)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 12px',
            background: 'rgba(37,211,102,0.08)',
            borderBottom: '1px solid rgba(37,211,102,0.12)',
            fontSize: 9,
            color: '#25d366',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            direction: 'ltr',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            Live Preview — {previewLead?.name}
          </div>

          {campaign.imageUrl && (
            <div style={{ padding: '8px 12px 0' }}>
              <div style={{
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <img
                  src={campaign.imageUrl}
                  alt="Offer"
                  style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
          )}

          <div
            dir="rtl"
            style={{
              padding: '10px 12px',
              fontSize: 13,
              color: '#e9edef',
              lineHeight: 1.8,
              background: 'linear-gradient(135deg, #005c4b, #004d40)',
              margin: campaign.imageUrl ? '8px 12px 12px' : undefined,
              borderRadius: campaign.imageUrl ? '0 0 var(--radius-sm) var(--radius-sm)' : undefined,
            }}
            dangerouslySetInnerHTML={{ __html: formatWhatsApp(preview) }}
          />
        </div>
      )}
    </div>
  );
}
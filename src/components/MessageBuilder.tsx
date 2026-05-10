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
        imageUrls={campaign.imageUrls}
        onChangeUrls={(urls) => onChangeCampaign({ ...campaign, imageUrls: urls })}
      />

      {/* WhatsApp-style preview */}
      {preview && (
        <div style={{
          background: '#0b141a',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1.226 10.88L0 9.654l2.581-2.58.148.147L1.226 8.723l2.846 2.846-1.226 1.226-2.846-2.846.147-.148-1.503-1.503zM20 9.654l-1.226 1.226-2.846-2.846 1.226-1.226 2.846 2.846zM2.846 18.5L0 15.654l1.226-1.226 2.846 2.846L2.846 18.5z\' fill=\'rgba(255,255,255,0.02)\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}>
          <div style={{
            fontSize: 10,
            color: '#25d366',
            letterSpacing: '0.02em',
            direction: 'ltr',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 16,
            fontWeight: 600,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            WhatsApp Preview — {previewLead?.name || 'Client'}
          </div>

          {/* Chat Bubble */}
          <div style={{
            background: '#005c4b',
            borderRadius: '0 8px 8px 8px',
            padding: '4px',
            maxWidth: '90%',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            position: 'relative',
          }}>
            {/* Tail */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: -8,
              width: 0,
              height: 0,
              borderTop: '8px solid #005c4b',
              borderLeft: '8px solid transparent',
            }} />

            {campaign.imageUrls.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                {campaign.imageUrls.filter(u => u).map((url, i) => (
                  <div
                    key={url + i}
                    style={{
                      width: campaign.imageUrls.length === 1 ? '100%' : 80,
                      height: campaign.imageUrls.length === 1 ? 'auto' : 80,
                      flexGrow: 1,
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Offer ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div
              dir="rtl"
              style={{
                padding: '4px 6px 8px',
                fontSize: 14,
                color: '#e9edef',
                lineHeight: 1.5,
              }}
              dangerouslySetInnerHTML={{ __html: formatWhatsApp(preview) }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
import type { Lead, Campaign } from '../types';
import { buildMessage } from '../lib/buildMessage';

interface Props {
  template: string;
  onChange: (t: string) => void;
  previewLead: Lead | null;
  campaign: Campaign;
}

const VARS = ['{{name}}', '{{discount}}', '{{duration}}', '{{url}}'];

export function MessageBuilder({ template, onChange, previewLead, campaign }: Props) {
  const preview = previewLead ? buildMessage(template, previewLead, campaign) : null;

  const insertVar = (v: string) => {
    const el = document.querySelector<HTMLTextAreaElement>('#msg-template');
    if (!el) return;
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    const next = template.slice(0, start) + v + template.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + v.length;
      el.focus();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', color: '#e94560', textTransform: 'uppercase' }}>
        Message Template
      </span>

      <textarea
        id="msg-template"
        value={template}
        onChange={(e) => onChange(e.target.value)}
        dir="rtl"
        rows={4}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(233,69,96,0.2)',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 12,
          color: '#e2e8f0',
          outline: 'none',
          fontFamily: '"Outfit", sans-serif',
          lineHeight: 1.7,
          resize: 'vertical',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(233,69,96,0.5)')}
        onBlur={(e) => (e.target.style.borderColor = 'rgba(233,69,96,0.2)')}
      />

      <div className="flex flex-wrap gap-1">
        {VARS.map(v => (
          <button
            key={v}
            onClick={() => insertVar(v)}
            style={{
              background: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: 5,
              padding: '3px 8px',
              fontSize: 10,
              color: '#f97316',
              cursor: 'pointer',
              fontFamily: '"JetBrains Mono", monospace',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(249,115,22,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(249,115,22,0.12)')}
          >
            {v}
          </button>
        ))}
      </div>

      {preview && (
        <div
          dir="rtl"
          style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRight: '3px solid #10b981',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 11.5,
            color: '#94a3b8',
            lineHeight: 1.75,
          }}
        >
          <div style={{ fontSize: 9, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6, direction: 'ltr' }}>
            Live Preview — {previewLead?.name}
          </div>
          {preview}
        </div>
      )}
    </div>
  );
}

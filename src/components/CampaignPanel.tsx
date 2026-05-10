import type { Campaign } from '../types';

interface Props {
  campaign: Campaign;
  onChange: (c: Campaign) => void;
}

const fields: { key: keyof Campaign; label: string; placeholder: string }[] = [
  { key: 'name',     label: 'Campaign Name',  placeholder: 'e.g. Ramadan 25%' },
  { key: 'discount', label: '{{discount}}',   placeholder: 'e.g. 25%' },
  { key: 'duration', label: '{{duration}}',   placeholder: 'e.g. أسبوع' },
  { key: 'url',      label: '{{url}} — Menu Link', placeholder: 'https://...' },
];

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

export function CampaignPanel({ campaign, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
        Campaign Settings
      </span>
      {fields.map(({ key, label, placeholder }) => (
        <div key={key} className="flex flex-col gap-2">
          <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            {label}
          </label>
          <input
            type={key === 'url' ? 'url' : 'text'}
            value={campaign[key]}
            placeholder={placeholder}
            style={inputStyle}
            onChange={(e) => onChange({ ...campaign, [key]: e.target.value })}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent)';
              e.target.style.background = 'rgba(255,255,255,0.04)';
              e.target.style.boxShadow = '0 0 0 1px var(--accent), inset 0 1px 2px rgba(0,0,0,0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
              e.target.style.background = 'rgba(255,255,255,0.02)';
              e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.2)';
            }}
          />
        </div>
      ))}
    </div>
  );
}
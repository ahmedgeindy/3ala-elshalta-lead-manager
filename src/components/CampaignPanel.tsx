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
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-sm)',
  padding: '7px 10px',
  fontSize: 12,
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  transition: 'border-color var(--transition-fast), background var(--transition-fast)',
};

export function CampaignPanel({ campaign, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <span className="label" style={{ color: 'var(--accent)' }}>
        Campaign Settings
      </span>
      {fields.map(({ key, label, placeholder }) => (
        <div key={key} className="flex flex-col gap-1">
          <label style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {label}
          </label>
          <input
            type={key === 'url' ? 'url' : 'text'}
            value={campaign[key]}
            placeholder={placeholder}
            style={inputStyle}
            onChange={(e) => onChange({ ...campaign, [key]: e.target.value })}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-border)';
              e.target.style.background = 'var(--accent-muted)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-medium)';
              e.target.style.background = 'rgba(255,255,255,0.04)';
            }}
          />
        </div>
      ))}
    </div>
  );
}
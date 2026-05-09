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
  border: '1px solid rgba(233,69,96,0.2)',
  borderRadius: 7,
  padding: '7px 10px',
  fontSize: 12,
  color: '#e2e8f0',
  outline: 'none',
  fontFamily: '"Outfit", sans-serif',
  transition: 'border-color 0.15s',
};

export function CampaignPanel({ campaign, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', color: '#e94560', textTransform: 'uppercase' }}>
        Campaign Settings
      </span>
      {fields.map(({ key, label, placeholder }) => (
        <div key={key} className="flex flex-col gap-1">
          <label style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {label}
          </label>
          <input
            type={key === 'url' ? 'url' : 'text'}
            value={campaign[key]}
            placeholder={placeholder}
            style={inputStyle}
            onChange={(e) => onChange({ ...campaign, [key]: e.target.value })}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(233,69,96,0.55)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(233,69,96,0.2)')}
          />
        </div>
      ))}
    </div>
  );
}

import { motion } from 'framer-motion';

interface Props {
  stats: { total: number; sent: number; pending: number };
}

export function ProgressPanel({ stats }: Props) {
  const pct = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="label" style={{ color: 'var(--accent)' }}>
          Progress
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: pct === 100 ? 'var(--success)' : 'var(--pending)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
          {pct}%
        </span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: '100%',
            borderRadius: 99,
            background: pct === 100 ? 'var(--success)' : 'var(--accent)',
          }}
        />
      </div>

      <div className="flex justify-between tabular-nums" style={{ fontSize: 11 }}>
        <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
          {stats.sent} sent
        </span>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {stats.total} total
        </span>
        <span style={{ color: 'var(--pending)', fontFamily: 'var(--font-mono)' }}>
          {stats.pending} left
        </span>
      </div>
    </div>
  );
}
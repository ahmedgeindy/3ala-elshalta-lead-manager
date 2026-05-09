import { motion } from 'framer-motion';

interface Props {
  stats: { total: number; sent: number; pending: number };
}

export function ProgressPanel({ stats }: Props) {
  const pct = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', color: '#e94560', textTransform: 'uppercase' }}>
          Progress
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: pct === 100 ? '#10b981' : '#f97316', fontFamily: '"JetBrains Mono", monospace' }}>
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
            background: 'linear-gradient(90deg, #e94560, #f97316)',
          }}
        />
      </div>

      <div className="flex justify-between" style={{ fontSize: 11 }}>
        <span style={{ color: '#10b981', fontFamily: '"JetBrains Mono", monospace' }}>
          {stats.sent} sent
        </span>
        <span style={{ color: '#64748b', fontFamily: '"JetBrains Mono", monospace' }}>
          {stats.total} total
        </span>
        <span style={{ color: '#f97316', fontFamily: '"JetBrains Mono", monospace' }}>
          {stats.pending} left
        </span>
      </div>
    </div>
  );
}

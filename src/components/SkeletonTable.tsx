import { motion } from 'framer-motion';

const ROWS = 10;

function Shimmer({ width, height, radius = 4 }: { width: number | string; height: number; radius?: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.35, 0.7, 0.35] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width, height, borderRadius: radius, background: 'rgba(255,255,255,0.09)', flexShrink: 0 }}
    />
  );
}

const nameWidths = ['55%', '70%', '48%', '62%', '75%', '52%', '67%', '58%', '44%', '71%'];

export function SkeletonTable() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
          <th style={{ padding: '10px 16px', width: 40 }} />
          <th style={{ padding: '10px 16px', width: 44 }}>
            <div style={{ height: 8, width: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />
          </th>
          <th style={{ padding: '10px 16px' }}>
            <div style={{ height: 8, width: 44, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />
          </th>
          <th style={{ padding: '10px 16px' }}>
            <div style={{ height: 8, width: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />
          </th>
          <th style={{ padding: '10px 16px', width: 110 }}>
            <div style={{ height: 8, width: 44, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />
          </th>
          <th style={{ padding: '10px 16px', width: 140 }} />
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: ROWS }).map((_, i) => (
          <motion.tr
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.035, type: 'spring', stiffness: 300, damping: 30 }}
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <td style={{ padding: '11px 16px', width: 40 }}>
              <Shimmer width={14} height={14} radius={3} />
            </td>
            <td style={{ padding: '11px 16px', width: 44 }}>
              <Shimmer width={22} height={11} />
            </td>
            <td style={{ padding: '11px 16px' }}>
              <Shimmer width={nameWidths[i]} height={13} />
            </td>
            <td style={{ padding: '11px 16px' }}>
              <Shimmer width={138} height={12} />
            </td>
            <td style={{ padding: '11px 16px', width: 110 }}>
              <Shimmer width={72} height={24} radius={6} />
            </td>
            <td style={{ padding: '11px 16px', width: 140 }}>
              <Shimmer width={86} height={30} radius={6} />
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}

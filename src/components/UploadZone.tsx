import { useCallback, useState } from 'react';
import { UploadSimple, FileCsv, Warning, ArrowsClockwise } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

interface Props {
  onFile: (file: File) => void;
  stats: { total: number; sent: number; pending: number };
  error: string | null;
  onResetHistory: () => void;
}

export function UploadZone({ onFile, stats, error, onResetHistory }: Props) {
  const [dragging, setDragging] = useState(false);
  const hasFile = stats.total > 0;

  const handleFile = useCallback((file: File) => { onFile(file); }, [onFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', color: '#e94560', textTransform: 'uppercase' }}>
          Contact File
        </span>
        {hasFile && (
          <button
            onClick={onResetHistory}
            title="Reset all sent history"
            className="flex items-center gap-1 transition-opacity hover:opacity-100 opacity-40"
            style={{ fontSize: 10, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowsClockwise size={11} />
            Reset History
          </button>
        )}
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          display: 'block',
          borderRadius: 10,
          border: `2px dashed ${dragging ? '#e94560' : hasFile ? 'rgba(233,69,96,0.35)' : 'rgba(255,255,255,0.1)'}`,
          background: dragging ? 'rgba(233,69,96,0.08)' : hasFile ? 'rgba(233,69,96,0.04)' : 'rgba(255,255,255,0.02)',
          padding: hasFile ? '10px 14px' : '18px 14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {hasFile ? (
          <div className="flex items-center gap-3">
            <FileCsv size={22} weight="fill" style={{ color: '#e94560', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', fontFamily: '"JetBrains Mono", monospace' }}>
                3laelshalta.csv
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                {stats.total} contacts · {stats.pending} pending
              </div>
            </div>
            <span style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap' }}>click to replace</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <UploadSimple size={22} style={{ color: '#475569' }} />
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Drop CSV or Excel here</div>
            <div style={{ fontSize: 10, color: '#475569' }}>3laelshalta.csv · .xlsx · .xls</div>
          </div>
        )}
      </label>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
          style={{ fontSize: 11, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 7, padding: '6px 10px' }}
        >
          <Warning size={13} />
          {error}
        </motion.div>
      )}
    </div>
  );
}

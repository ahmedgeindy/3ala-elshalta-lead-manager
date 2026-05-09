import { useCallback, useState } from 'react';
import { UploadSimple, FileCsv, Warning, ArrowsClockwise, Spinner } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

interface Props {
  onFile: (file: File) => void;
  stats: { total: number; sent: number; pending: number };
  error: string | null;
  onResetHistory: () => void;
  loading?: boolean;
}

export function UploadZone({ onFile, stats, error, onResetHistory, loading }: Props) {
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
        <span className="label" style={{ color: 'var(--accent)' }}>
          Contact File
        </span>
        {hasFile && (
          <button
            onClick={onResetHistory}
            title="Reset all sent history"
            className="flex items-center gap-1"
            style={{ fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color var(--transition-fast)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <ArrowsClockwise size={11} />
            Reset History
          </button>
        )}
      </div>

      <label
        onDragOver={(e) => { if (!loading) { e.preventDefault(); setDragging(true); } }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { if (!loading) handleDrop(e); }}
        style={{
          display: 'block',
          borderRadius: 'var(--radius-md)',
          border: `2px dashed ${loading ? 'var(--accent-border)' : dragging ? 'var(--accent)' : hasFile ? 'var(--accent-border)' : 'var(--border-medium)'}`,
          background: loading ? 'var(--accent-muted)' : dragging ? 'var(--accent-muted)' : hasFile ? 'rgba(233,69,96,0.04)' : 'rgba(255,255,255,0.02)',
          padding: (hasFile || loading) ? '10px 14px' : '18px 14px',
          cursor: loading ? 'default' : 'pointer',
          transition: 'all var(--transition-base)',
        }}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          disabled={loading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {loading ? (
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ flexShrink: 0, display: 'flex' }}
            >
              <Spinner size={20} style={{ color: 'var(--accent)' }} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>Processing contacts...</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Reading rows and normalizing phones</div>
            </div>
          </div>
        ) : hasFile ? (
          <div className="flex items-center gap-3">
            <FileCsv size={22} weight="fill" style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
                3laelshalta.csv
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                {stats.total} contacts · {stats.pending} pending
              </div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>click to replace</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <UploadSimple size={22} style={{ color: 'var(--text-muted)' }} />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Drop CSV or Excel here</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>3laelshalta.csv · .xlsx · .xls</div>
          </div>
        )}
      </label>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
          style={{ fontSize: 11, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}
        >
          <Warning size={13} />
          {error}
        </motion.div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsappLogo, SkipForward, X, CheckCircle } from '@phosphor-icons/react';
import type { Lead, Campaign } from '../types';
import { buildMessage, buildWaLink } from '../lib/buildMessage';

interface Props {
  leads: Lead[];
  campaign: Campaign;
  template: string;
  onMarkSent: (id: string) => void;
  onClose: () => void;
}

export function BulkSendQueue({ leads, campaign, template, onMarkSent, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [opened, setOpened] = useState(false);

  const lead = leads[index];
  const isLast = index === leads.length - 1;
  const pct = Math.round(((index) / leads.length) * 100);

  useEffect(() => { setOpened(false); }, [index]);

  if (!lead) {
    return (
      <Overlay>
        <DoneCard total={leads.length} onClose={onClose} />
      </Overlay>
    );
  }

  const handleOpen = () => {
    const msg = buildMessage(template, lead, campaign);
    window.open(buildWaLink(lead.phone, msg), '_blank');
    onMarkSent(lead.id);
    setOpened(true);
  };

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setIndex(i => i + 1);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      onClose();
    } else {
      setIndex(i => i + 1);
    }
  };

  const preview = buildMessage(template, lead, campaign);

  return (
    <Overlay>
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'linear-gradient(160deg, #1a0a2e 0%, #16213e 100%)',
          border: '1px solid rgba(233,69,96,0.35)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Progress header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <div style={{ fontSize: 12, color: '#64748b' }}>
              <span style={{ color: '#e94560', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>{index + 1}</span>
              <span style={{ color: '#475569' }}> / {leads.length}</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4 }}
              style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #e94560, #f97316)' }}
            />
          </div>
        </div>

        {/* Lead card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ padding: '20px 24px' }}
          >
            {/* Contact info */}
            <div className="flex items-start gap-4 mb-5">
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(233,69,96,0.2), rgba(249,115,22,0.15))',
                  border: '1px solid rgba(233,69,96,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#e94560', flexShrink: 0,
                }}
              >
                {lead.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 3 }}>{lead.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontFamily: '"JetBrains Mono", monospace', direction: 'ltr' }}>{lead.phone}</div>
              </div>
            </div>

            {/* Message preview */}
            <div
              dir="rtl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 12,
                color: '#94a3b8',
                lineHeight: 1.75,
                marginBottom: 20,
                maxHeight: 100,
                overflowY: 'auto',
              }}
            >
              {preview}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {!opened ? (
                <button
                  onClick={handleOpen}
                  className="flex items-center gap-2 flex-1"
                  style={{
                    justifyContent: 'center',
                    background: 'linear-gradient(90deg, #e94560, #f97316)',
                    border: 'none', borderRadius: 10, padding: '11px 20px',
                    fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
                    fontFamily: '"Outfit", sans-serif',
                    boxShadow: '0 4px 18px rgba(233,69,96,0.4)',
                    transition: 'transform 0.1s',
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <WhatsappLogo size={16} weight="fill" />
                  إرسال عبر واتساب
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 flex-1"
                  style={{
                    justifyContent: 'center',
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.35)',
                    borderRadius: 10, padding: '11px 20px',
                    fontSize: 14, fontWeight: 700,
                    color: '#10b981', cursor: 'pointer',
                    fontFamily: '"Outfit", sans-serif',
                    transition: 'transform 0.1s',
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <CheckCircle size={16} weight="fill" />
                  {isLast ? 'Finish' : 'Next →'}
                </button>
              )}

              <button
                onClick={handleSkip}
                className="flex items-center gap-1"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '11px 14px',
                  fontSize: 12, color: '#64748b', cursor: 'pointer',
                  fontFamily: '"Outfit", sans-serif',
                }}
              >
                <SkipForward size={14} />
                Skip
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(7,5,20,0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      {children}
    </motion.div>
  );
}

function DoneCard({ total, onClose }: { total: number; onClose: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        background: 'linear-gradient(160deg, #1a0a2e, #16213e)',
        border: '1px solid rgba(16,185,129,0.4)',
        borderRadius: 20, padding: '40px 48px',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}
    >
      <CheckCircle size={48} weight="fill" style={{ color: '#10b981', marginBottom: 16 }} />
      <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
        All Done!
      </div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
        Sent to {total} contacts successfully.
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'linear-gradient(90deg, #e94560, #f97316)',
          border: 'none', borderRadius: 10, padding: '10px 28px',
          fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
          fontFamily: '"Outfit", sans-serif',
        }}
      >
        Close
      </button>
    </motion.div>
  );
}

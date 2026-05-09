import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsappLogo, SkipForward, X, CheckCircle } from '@phosphor-icons/react';
import type { Lead, Campaign } from '../types';
import { buildMessage, buildWaLink } from '../lib/buildMessage';
import { formatWhatsApp } from '../lib/formatWhatsApp';

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
          background: 'var(--bg-raised)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }} className="tabular-nums">
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{index + 1}</span>
              <span style={{ color: 'var(--text-muted)' }}> / {leads.length}</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4, transition: 'color var(--transition-fast)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              <X size={16} />
            </button>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4 }}
              style={{ height: '100%', borderRadius: 99, background: 'var(--accent)' }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ padding: '20px 24px' }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                }}
              >
                {lead.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{lead.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', direction: 'ltr' }} className="tabular-nums">{lead.phone}</div>
              </div>
            </div>

            {campaign.imageUrl && (
              <div style={{ padding: '0 14px 8px' }}>
                <img
                  src={campaign.imageUrl}
                  alt="Offer"
                  style={{
                    width: '100%',
                    maxHeight: 120,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)',
                    display: 'block',
                  }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            <div
              dir="rtl"
              dangerouslySetInnerHTML={{ __html: formatWhatsApp(preview) }}
              style={{
                background: 'linear-gradient(135deg, #005c4b, #004d40)',
                border: '1px solid rgba(37,211,102,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: 12,
                color: '#e9edef',
                lineHeight: 1.8,
                marginBottom: 20,
                maxHeight: 120,
                overflowY: 'auto',
              }}
            />

            <div className="flex items-center gap-3">
              {!opened ? (
                <button
                  onClick={handleOpen}
                  className="flex items-center gap-2 flex-1"
                  style={{
                    justifyContent: 'center',
                    background: 'var(--accent)',
                    border: 'none', borderRadius: 'var(--radius-md)', padding: '11px 20px',
                    fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    boxShadow: '0 4px 18px rgba(233,69,96,0.4)',
                    transition: 'transform 0.1s, box-shadow var(--transition-base)',
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(233,69,96,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(233,69,96,0.4)')}
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
                    background: 'var(--success-muted)',
                    border: `1px solid var(--success-border)`,
                    borderRadius: 'var(--radius-md)', padding: '11px 20px',
                    fontSize: 14, fontWeight: 700,
                    color: 'var(--success)', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'transform 0.1s, background var(--transition-fast)',
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--success-muted)')}
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
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', padding: '11px 14px',
                  fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
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
        backdropFilter: 'blur(8px)',
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
        background: 'var(--bg-raised)',
        border: `1px solid var(--success-border)`,
        borderRadius: 'var(--radius-xl)', padding: '40px 48px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <CheckCircle size={48} weight="fill" style={{ color: 'var(--success)', marginBottom: 16 }} />
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
        All Done
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
        Sent to {total} contacts successfully.
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'var(--accent)',
          border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 28px',
          fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'transform var(--transition-fast), box-shadow var(--transition-base)',
        }}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Close
      </button>
    </motion.div>
  );
}
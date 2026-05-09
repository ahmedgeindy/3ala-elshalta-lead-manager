import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LockSimple, Eye, EyeSlash, Warning } from '@phosphor-icons/react';

const AUTH_KEY = 'shalta_auth_v1';
const CORRECT  = import.meta.env.VITE_APP_PASSWORD ?? '';

interface Props {
  children: React.ReactNode;
}

export function LoginGate({ children }: Props) {
  const [authed, setAuthed] = useState(
    () => Boolean(CORRECT) && sessionStorage.getItem(AUTH_KEY) === '1'
  );

  if (authed) return <>{children}</>;
  return <LoginScreen onSuccess={() => setAuthed(true)} />;
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [value, setValue]   = useState('');
  const [show, setShow]     = useState(false);
  const [shake, setShake]   = useState(false);
  const [error, setError]   = useState(false);

  const submit = () => {
    if (!CORRECT) {
      if (import.meta.env.DEV) {
        sessionStorage.setItem(AUTH_KEY, '1');
        onSuccess();
      }
      return;
    }
    if (value === CORRECT) {
      sessionStorage.setItem(AUTH_KEY, '1');
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setValue('');
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
      }}
    >
      <div style={{
        position: 'absolute',
        width: 320, height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(233,69,96,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '40px 36px',
          background: 'var(--bg-raised)',
          border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : 'var(--accent-border)'}`,
          borderRadius: 'var(--radius-xl)',
          backdropFilter: 'blur(24px)',
          boxShadow: 'var(--shadow-lg)',
          transition: 'border-color 0.2s',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px',
            background: 'var(--accent-muted)',
            border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LockSimple size={24} style={{ color: 'var(--accent)' }} weight="fill" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', letterSpacing: 0.5 }}>
            على الشلته
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Lead Manager — Private Access
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.8px', color: 'var(--text-muted)',
            textTransform: 'uppercase', marginBottom: 8,
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={value}
              autoFocus
              placeholder="Enter access password"
              onChange={e => { setValue(e.target.value); setError(false); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'var(--border-medium)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '11px 40px 11px 14px',
                fontSize: 14,
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                letterSpacing: show ? 0 : 3,
                transition: 'border-color var(--transition-fast), background var(--transition-fast)',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--accent-border)';
                e.target.style.background = 'var(--accent-muted)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', padding: 2,
                display: 'flex',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {show ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: '#f87171',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 'var(--radius-sm)', padding: '7px 10px', marginBottom: 14,
              }}
            >
              <Warning size={13} />
              Incorrect password. Try again.
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={submit}
          disabled={!value}
          style={{
            width: '100%',
            background: value ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            fontSize: 14, fontWeight: 700,
            color: value ? '#fff' : 'var(--text-muted)',
            cursor: value ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-sans)',
            transition: 'all var(--transition-base)',
            boxShadow: value ? '0 4px 18px rgba(233,69,96,0.35)' : 'none',
          }}
          onMouseDown={e => value && ((e.target as HTMLElement).style.transform = 'scale(0.98)')}
          onMouseUp={e => ((e.target as HTMLElement).style.transform = 'scale(1)')}
          onMouseEnter={e => { if (value) (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(233,69,96,0.5)'; }}
          onMouseLeave={e => { if (value) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(233,69,96,0.35)'; }}
        >
          Enter
        </button>

        {import.meta.env.DEV && !CORRECT && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14 }}>
            Dev mode: set VITE_APP_PASSWORD in .env.local
          </div>
        )}
      </motion.div>
    </div>
  );
}
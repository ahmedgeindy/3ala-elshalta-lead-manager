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
        background: 'linear-gradient(135deg, #0a0917 0%, #0d0d1f 50%, #12112a 100%)',
      }}
    >
      <div style={{
        position: 'absolute',
        width: 320, height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(233,69,96,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '40px 36px',
          background: 'rgba(16,15,36,0.9)',
          border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : 'rgba(233,69,96,0.25)'}`,
          borderRadius: 20,
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          transition: 'border-color 0.2s',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, rgba(233,69,96,0.2), rgba(249,115,22,0.15))',
            border: '1px solid rgba(233,69,96,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LockSimple size={24} style={{ color: '#e94560' }} weight="fill" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#e94560', letterSpacing: 0.5 }}>
            على الشلته
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
            Lead Manager — Private Access
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: 10, fontWeight: 700,
            letterSpacing: '1px', color: '#64748b',
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
                border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(233,69,96,0.2)'}`,
                borderRadius: 10,
                padding: '11px 40px 11px 14px',
                fontSize: 14,
                color: '#e2e8f0',
                outline: 'none',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: show ? 0 : 3,
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                color: '#475569', cursor: 'pointer', padding: 2,
                display: 'flex',
              }}
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
                borderRadius: 8, padding: '7px 10px', marginBottom: 14,
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
            background: value
              ? 'linear-gradient(90deg, #e94560, #f97316)'
              : 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: 10,
            padding: '12px',
            fontSize: 14, fontWeight: 700,
            color: value ? '#fff' : '#475569',
            cursor: value ? 'pointer' : 'not-allowed',
            fontFamily: '"Outfit", sans-serif',
            transition: 'all 0.2s',
            boxShadow: value ? '0 4px 18px rgba(233,69,96,0.35)' : 'none',
          }}
          onMouseDown={e => value && ((e.target as HTMLElement).style.transform = 'scale(0.98)')}
          onMouseUp={e => ((e.target as HTMLElement).style.transform = 'scale(1)')}
        >
          Enter
        </button>

        {import.meta.env.DEV && !CORRECT && (
          <div style={{ fontSize: 10, color: '#334155', textAlign: 'center', marginTop: 14 }}>
            Dev mode: set VITE_APP_PASSWORD in .env.local
          </div>
        )}
      </motion.div>
    </div>
  );
}
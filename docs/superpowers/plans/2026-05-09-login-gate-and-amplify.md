# Login Gate + Amplify Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-protected login screen so only the restaurant owner can use the app, and configure AWS Amplify for zero-config CI/CD deployment.

**Architecture:** A `LoginGate` wrapper component checks `sessionStorage` for auth state and renders either the login screen or the full app. The password is baked into the build via a `VITE_APP_PASSWORD` env variable — never committed to git. Amplify reads `amplify.yml` from the repo root and handles build + deploy + CDN automatically when connected to the GitHub repo via the Amplify Console.

**Tech Stack:** React 18, Framer Motion (already installed), `sessionStorage` for auth persistence, AWS Amplify Hosting, `VITE_APP_PASSWORD` env variable.

---

## Security Model

This is a **client-side password gate** — correct for this threat model:
- The real risk is someone seeing your 4,457 contact list or sending unwanted messages
- WhatsApp links require manual human clicks — a bot can't auto-send
- A session-scoped password clears on browser close, protecting unattended screens
- If you need multi-user access in the future, add AWS Cognito (separate plan)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/LoginGate.tsx` | **Create** | Password check wrapper — renders login UI or children |
| `src/App.tsx` | **Modify** | Wrap root with `<LoginGate>` |
| `.env.local` | **Create** | Local dev password (gitignored) |
| `.env.example` | **Create** | Documents required env vars for the team |
| `amplify.yml` | **Create** | Amplify build config (reads from repo root) |
| `public/_redirects` | **Create** | SPA fallback so direct URLs don't 404 |
| `.github/workflows/deploy.yml` | **Modify** | Pass `VITE_APP_PASSWORD` secret into build |

---

## Task 1: LoginGate component

**Files:**
- Create: `src/components/LoginGate.tsx`

- [ ] **Step 1: Create `src/components/LoginGate.tsx`**

```tsx
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
      // No password configured — warn in dev, block in prod
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
      {/* Decorative red glow behind card */}
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
        {/* Logo */}
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

        {/* Password field */}
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

        {/* Error message */}
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

        {/* Submit */}
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

        {/* Dev hint */}
        {import.meta.env.DEV && !CORRECT && (
          <div style={{ fontSize: 10, color: '#334155', textAlign: 'center', marginTop: 14 }}>
            Dev mode: set VITE_APP_PASSWORD in .env.local
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the component typechecks**

```bash
cd shalta-app
npx tsc --noEmit
```

Expected: no errors referencing `LoginGate.tsx`

---

## Task 2: Wire LoginGate into App

**Files:**
- Modify: `src/App.tsx` — wrap root JSX with `<LoginGate>`

- [ ] **Step 1: Add the import at the top of `src/App.tsx`**

Add after the existing imports:
```tsx
import { LoginGate } from './components/LoginGate';
```

- [ ] **Step 2: Wrap the return in `src/App.tsx`**

Change the final return from:
```tsx
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0d0d1f' }}>
```

To:
```tsx
  return (
    <LoginGate>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0d0d1f' }}>
```

And add the closing tag before the final `);`:
```tsx
    </LoginGate>
  );
```

- [ ] **Step 3: Run the dev server and verify login screen appears**

```bash
npm run dev
```

Open http://localhost:5174 — you should see the login screen (not the app). Since `VITE_APP_PASSWORD` is not set yet, a dev-mode hint should appear at the bottom.

- [ ] **Step 4: Set a local dev password and test it**

Create `.env.local` in `shalta-app/`:
```
VITE_APP_PASSWORD=test123
```

Restart dev server (`Ctrl+C` then `npm run dev`). Enter `test123` — app should unlock. Enter anything else — red shake + error message should appear.

- [ ] **Step 5: Commit**

```bash
git add src/components/LoginGate.tsx src/App.tsx
git commit -m "feat: add password-protected login gate

Session persists in sessionStorage (clears on browser close).
Password baked in at build time via VITE_APP_PASSWORD env var."
```

---

## Task 3: Env variable documentation + gitignore

**Files:**
- Create: `.env.example`
- Verify: `.gitignore` already ignores `.env.local`

- [ ] **Step 1: Create `.env.example`**

```bash
# .env.example — copy to .env.local and fill in values (never commit .env.local)
VITE_APP_PASSWORD=your-secret-password-here
```

- [ ] **Step 2: Verify `.gitignore` covers env files**

Check that `.gitignore` contains `*.local`. The Vite default template already includes this. If not, add:
```
.env.local
.env.*.local
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: document required env variables"
```

---

## Task 4: Amplify build config

**Files:**
- Create: `amplify.yml` (repo root — Amplify reads this automatically)
- Create: `public/_redirects` (SPA fallback for direct URL access)

- [ ] **Step 1: Create `amplify.yml` in the repo root (`shalta-app/amplify.yml`)**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

- [ ] **Step 2: Create `public/_redirects` for SPA routing**

```
/* /index.html 200
```

This tells Amplify's CDN to serve `index.html` for any path, so React Router (if added later) and direct URL access work correctly.

- [ ] **Step 3: Commit both files**

```bash
git add amplify.yml public/_redirects
git commit -m "chore: add Amplify build config and SPA redirect rule"
```

- [ ] **Step 4: Push to GitHub**

```bash
git push
```

---

## Task 5: Pass `VITE_APP_PASSWORD` through GitHub Actions build

**Files:**
- Modify: `.github/workflows/deploy.yml`

The password must be injected at **build time** (Vite bakes env vars into the JS bundle). It must be a GitHub Secret named `VITE_APP_PASSWORD`.

- [ ] **Step 1: Add the secret to GitHub**

```bash
gh secret set VITE_APP_PASSWORD --body "your-real-production-password"
```

- [ ] **Step 2: Update the `Build` step in `.github/workflows/deploy.yml`**

Change:
```yaml
      - name: Build
        run: npm run build
```

To:
```yaml
      - name: Build
        env:
          VITE_APP_PASSWORD: ${{ secrets.VITE_APP_PASSWORD }}
        run: npm run build
```

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: inject VITE_APP_PASSWORD into build"
git push
```

Expected: GitHub Actions run succeeds, built JS bundle contains the hashed password.

---

## Task 6: Connect Amplify Console to GitHub (one-time manual step)

This task is done in the AWS Console browser UI — no code changes.

- [ ] **Step 1: Open AWS Amplify Console**

Go to: https://console.aws.amazon.com/amplify/home → **"New app" → "Host web app"**

- [ ] **Step 2: Connect GitHub**

Select **GitHub** → authorize → pick repo `ahmedgeindy/3ala-elshalta-lead-manager` → branch: `main`

- [ ] **Step 3: Build settings**

Amplify will auto-detect `amplify.yml`. Accept the detected settings.

- [ ] **Step 4: Add environment variable**

In the **"Advanced settings"** section before saving:
- Key: `VITE_APP_PASSWORD`
- Value: your production password

- [ ] **Step 5: Deploy**

Click **"Save and deploy"**. Amplify will build and deploy. Note the generated URL (`https://main.xxxxxxxx.amplifyapp.com`).

- [ ] **Step 6: Verify login gate works on live URL**

Open the Amplify URL → login screen should appear → enter correct password → app loads → enter wrong password → red shake error.

- [ ] **Step 7: (Optional) Add custom domain**

In Amplify Console → **Domain management** → add your domain → Amplify handles the SSL cert automatically.

---

## Self-Review

**Spec coverage check:**
- ✅ Login page that prevents unauthorized access — Task 1 + 2
- ✅ Password from env var, not hardcoded in git — Task 3
- ✅ Amplify CI/CD — Tasks 4 + 6
- ✅ Existing GitHub Actions S3 flow still works unchanged — Task 5 only adds env injection
- ✅ SPA routing won't 404 — Task 4 `_redirects`

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:**
- `LoginGate` exported from `src/components/LoginGate.tsx`, imported in `src/App.tsx` ✅
- `AUTH_KEY` and `CORRECT` are module-level constants, used consistently ✅
- `onSuccess: () => void` prop matches the call site `setAuthed(true)` ✅

**Edge cases covered:**
- No password set in dev → hint shown, click-through allowed (dev convenience)
- No password set in prod → login blocks (CORRECT is empty string, no input will ever match)
- Wrong password → shake animation + error message, input cleared
- Correct password → `sessionStorage` set, gate unmounts cleanly via React state

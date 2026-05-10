import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { SmartMenuPage } from '../types';
import { fetchPublicPage } from '../lib/smartMenuApi';
import SmartMenuGallery from './SmartMenuGallery';
import SmartMenuCta from './SmartMenuCta';

export default function SmartMenuPageView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<SmartMenuPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(null);
    fetchPublicPage(slug).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
      } else {
        setPage(result.data ?? null);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const cleanup = loadPage();
    return () => { if (cleanup) cleanup(); };
  }, [loadPage]);

  if (!slug) {
    return (
      <div style={pageShellStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⊘</div>
          <h1 style={errorTitleStyle}>Page not found</h1>
          <p style={errorDescStyle}>The page you are looking for does not exist.</p>
          <Link to="/" style={{ ...errorLinkStyle, background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}>Go home</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={pageShellStyle}>
        <style>{`@keyframes smart-menu-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={loaderStyle}>
          <div style={spinnerStyle} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 16 }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isExpiredOrGone = error.toLowerCase().includes('not found') || error.toLowerCase().includes('expired');
    return (
      <div style={pageShellStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{isExpiredOrGone ? '⏳' : '⚠️'}</div>
          <h1 style={errorTitleStyle}>
            {isExpiredOrGone ? 'This offer has expired' : 'Something went wrong'}
          </h1>
          <p style={errorDescStyle}>
            {isExpiredOrGone
              ? 'Contact the restaurant directly.'
              : 'Please try again.'}
          </p>
          {page?.orderPhone && (
            <a
              href={`tel:${page.orderPhone}`}
              style={{ ...errorLinkStyle, background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', marginBottom: 8 }}
            >
              Call {page.orderPhone}
            </a>
          )}
          {!isExpiredOrGone && (
            <button
              onClick={loadPage}
              style={{ ...errorLinkStyle, background: 'var(--accent)', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-sans)' }}
            >
              Try again
            </button>
          )}
          {isExpiredOrGone && (
            <Link to="/" style={{ ...errorLinkStyle, background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: 12, padding: '10px 20px' }}>Go home</Link>
          )}
        </div>
      </div>
    );
  }

  if (!page) return null;

  if (!page.isActive) {
    return (
      <div style={pageShellStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h1 style={errorTitleStyle}>This offer has expired</h1>
          <p style={errorDescStyle}>Contact the restaurant directly.</p>
          {page.orderPhone && (
            <a
              href={`tel:${page.orderPhone}`}
              style={{ ...errorLinkStyle, background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', marginBottom: 8 }}
            >
              Call {page.orderPhone}
            </a>
          )}
          <Link to="/" style={{ ...errorLinkStyle, background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: 12, padding: '10px 20px' }}>Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageShellStyle, alignItems: 'flex-start' }}>
      <style>{`@keyframes smart-menu-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={contentStyle}>
        <header style={heroStyle}>
          <div style={brandStyle}>
            <span style={brandNameStyle}>Al Shalta</span>
            <span style={brandSubStyle}>عرض خاص</span>
          </div>

          <h1 style={headlineStyle}>{page.offerHeadline}</h1>

          {page.offerDescription && (
            <p style={descStyle}>{page.offerDescription}</p>
          )}

          {page.orderPhone && (
            <div style={ctaHeroWrapStyle}>
              <SmartMenuCta phone={page.orderPhone} message={page.orderMessage} />
            </div>
          )}
        </header>

        {page.imageUrls.length > 0 && (
          <section style={gallerySectionStyle}>
            <h2 style={sectionTitleStyle}>المنيو</h2>
            <SmartMenuGallery imageUrls={page.imageUrls} />
          </section>
        )}

        {page.orderPhone && (
          <section style={trustSectionStyle}>
            <div style={trustRowStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              <a href={`tel:${page.orderPhone}`} style={trustLinkStyle}>{page.orderPhone}</a>
            </div>
          </section>
        )}

        {page.orderPhone && (
          <div style={ctaBottomWrapStyle}>
            <SmartMenuCta phone={page.orderPhone} message={page.orderMessage} />
          </div>
        )}
      </div>
    </div>
  );
}

const pageShellStyle: React.CSSProperties = {
  minHeight: '100dvh',
  background: 'var(--bg-base)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const contentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 520,
  padding: '0 20px 40px',
  display: 'flex',
  flexDirection: 'column',
};

const heroStyle: React.CSSProperties = {
  padding: '48px 0 32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
};

const brandStyle: React.CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  marginBottom: 24,
};

const brandNameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  fontFamily: 'var(--font-sans)',
};

const brandSubStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--text-muted)',
  letterSpacing: '0.04em',
};

const headlineStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 750,
  lineHeight: 1.2,
  color: 'var(--text-primary)',
  margin: 0,
  maxWidth: 400,
};

const descStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.6,
  color: 'var(--text-secondary)',
  margin: '12px 0 0',
  maxWidth: 380,
};

const ctaHeroWrapStyle: React.CSSProperties = {
  marginTop: 28,
  width: '100%',
  maxWidth: 320,
};

const gallerySectionStyle: React.CSSProperties = {
  marginTop: 32,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 16,
};

const trustSectionStyle: React.CSSProperties = {
  marginTop: 28,
  paddingTop: 20,
  borderTop: '1px solid var(--border-subtle)',
};

const trustRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const trustLinkStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontFamily: 'var(--font-mono)',
  direction: 'ltr',
};

const ctaBottomWrapStyle: React.CSSProperties = {
  marginTop: 32,
  position: 'sticky',
  bottom: 0,
  paddingTop: 16,
  paddingBottom: 16,
  background: 'linear-gradient(to top, var(--bg-base) 60%, transparent)',
  zIndex: 10,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-lg)',
  padding: '40px 32px',
  textAlign: 'center',
  maxWidth: 380,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const errorTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--text-primary)',
  margin: '0 0 8px',
};

const errorDescStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-muted)',
  margin: '0 0 24px',
  lineHeight: 1.5,
};

const errorLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 24px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  color: '#fff',
  transition: 'var(--transition-fast)',
  cursor: 'pointer',
};

const loaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const spinnerStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: '3px solid var(--border-medium)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'smart-menu-spin 0.8s linear infinite',
};
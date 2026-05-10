import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { SmartMenuPage } from '../types';

export default function SmartMenuPageView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<SmartMenuPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function fetchPage() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/public/pages/${slug}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Page not found');
          throw new Error('Failed to load page');
        }
        const data: SmartMenuPage = await res.json();
        if (!cancelled) setPage(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPage();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>{page.title}</h1>
      <h2 style={{ fontSize: 18, marginTop: 12 }}>{page.offerHeadline}</h2>
      <p style={{ marginTop: 8, color: '#666' }}>{page.offerDescription}</p>
      {page.imageUrls.length > 0 && (
        <img src={page.imageUrls[0]} alt="" style={{ width: '100%', borderRadius: 8, marginTop: 16 }} />
      )}
    </div>
  );
}
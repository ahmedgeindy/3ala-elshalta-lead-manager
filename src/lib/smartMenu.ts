import type { Campaign, SmartMenuDraft, SmartMenuPage, SmartMenuPublishResult } from '../types';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const API_BASE = (import.meta.env.VITE_SMART_MENU_API_BASE ?? '/api/smart-menu').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_SMART_MENU_API_KEY ?? '';

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function validateSlug(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Smart link slug is required.';
  }

  if (!SLUG_PATTERN.test(value)) {
    return 'Use lowercase letters, numbers, and single hyphens only.';
  }

  return null;
}

export function createDefaultSmartMenuDraft(campaign: Campaign): SmartMenuDraft {
  const campaignName = campaign.name || 'Al Shalta Campaign';

  return {
    id: campaign.smartMenuPageId,
    slug: normalizeSlug(campaign.name || 'shalta-offer'),
    campaignName,
    title: 'Al Shalta Menu',
    offerHeadline: campaign.discount ? `${campaign.discount} off today` : 'Special offer today',
    offerDescription: campaign.duration
      ? `Valid for ${campaign.duration}.`
      : 'Open the menu and order through WhatsApp.',
    imageUrls: campaign.imageUrls,
    orderPhone: '201098237733',
    orderMessage: campaign.name
      ? `I want to order from ${campaign.name}`
      : 'I want to order from Al Shalta offer',
    isActive: true,
  };
}

export function getSmartMenuPublicPath(slug: string): string {
  return `/m/${slug}`;
}

export function buildSmartMenuWhatsAppUrl(orderPhone: string, orderMessage: string): string {
  const phone = orderPhone.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(orderMessage)}`;
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers['X-Smart-Menu-Key'] = API_KEY;
  }

  return headers;
}

async function getPublishErrorMessage(response: Response): Promise<string> {
  const { status } = response;

  if (status === 409) {
    return 'This smart link is already used. Try another slug.';
  }

  if (status === 401 || status === 403) {
    return 'Smart menu publishing is not authorized. Check Cloudflare API key setup.';
  }

  const responseText = await response.text();
  return responseText || 'Failed to publish smart menu page.';
}

export async function publishSmartMenuPage(draft: SmartMenuDraft): Promise<SmartMenuPublishResult> {
  const slugError = validateSlug(draft.slug);
  if (slugError) {
    throw new Error(slugError);
  }

  const hasId = Boolean(draft.id);
  let response: Response;
  try {
    response = await fetch(hasId ? `${API_BASE}/pages/${encodeURIComponent(draft.id ?? '')}` : `${API_BASE}/pages`, {
      method: hasId ? 'PUT' : 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(draft),
    });
  } catch {
    throw new Error('Failed to publish smart menu page.');
  }

  if (!response.ok) {
    throw new Error(await getPublishErrorMessage(response));
  }

  let page: SmartMenuPage;
  try {
    page = await response.json() as SmartMenuPage;
  } catch {
    throw new Error('Failed to publish smart menu page.');
  }

  return {
    page,
    publicPath: getSmartMenuPublicPath(page.slug),
  };
}

export async function fetchSmartMenuPageBySlug(slug: string): Promise<SmartMenuPage> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/pages/by-slug/${encodeURIComponent(slug)}`);
  } catch {
    throw new Error('LOAD_FAILED');
  }

  if (response.status === 404) {
    throw new Error('NOT_FOUND');
  }

  if (response.status === 410) {
    throw new Error('INACTIVE');
  }

  if (!response.ok) {
    throw new Error('LOAD_FAILED');
  }

  try {
    return await response.json() as SmartMenuPage;
  } catch {
    throw new Error('LOAD_FAILED');
  }
}

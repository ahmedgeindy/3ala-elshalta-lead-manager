import type { Campaign } from '../types';

const SENT_KEY = 'shalta_sent_v1';
const CAMPAIGN_KEY = 'shalta_campaign_v1';

const DEFAULT_CAMPAIGN: Campaign = {
  name: '',
  discount: '',
  duration: '',
  url: '',
  imageUrls: [],
};

export function getSentPhones(): Set<string> {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function addSentPhone(phone: string): void {
  try {
    const phones = getSentPhones();
    phones.add(phone);
    localStorage.setItem(SENT_KEY, JSON.stringify([...phones]));
  } catch {}
}

export function clearSentPhones(): void {
  localStorage.removeItem(SENT_KEY);
}

export function saveCampaign(campaign: Campaign): void {
  try {
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaign));
  } catch {}
}

export function loadCampaign(): Campaign | null {
  try {
    const raw = localStorage.getItem(CAMPAIGN_KEY);
    if (!raw) return null;
    const loaded = JSON.parse(raw);

    // Migrate legacy single imageUrl to imageUrls array
    if (loaded && typeof loaded.imageUrl === 'string' && !loaded.imageUrls) {
      loaded.imageUrls = loaded.imageUrl ? [loaded.imageUrl] : [];
      delete loaded.imageUrl;
    }

    return { ...DEFAULT_CAMPAIGN, ...loaded };
  } catch {
    return null;
  }
}

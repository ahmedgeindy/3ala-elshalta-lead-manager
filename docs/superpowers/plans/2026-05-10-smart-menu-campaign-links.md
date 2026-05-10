# Smart Menu Campaign Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build campaign-specific smart menu links so WhatsApp messages use a clean `/m/<slug>` URL instead of raw S3 image links.

**Architecture:** The React app gains an operator Smart Menu editor and a public `/m/:slug` customer route. A Cloudflare Worker backed by D1 stores smart menu page records and serves public campaign data by slug. The existing image upload flow stays unchanged; smart menu pages store public image URLs.

**Tech Stack:** React 19, TypeScript, Vite, Cloudflare Worker, Cloudflare D1, existing localStorage campaign persistence.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/types.ts` | Modify | Add `SmartMenuPage`, `SmartMenuDraft`, API result types, and extend `Campaign` with `smartMenuPageId`. |
| `src/lib/smartMenu.ts` | Create | Slug validation, draft creation, WhatsApp link creation, payload mapping, and API client. |
| `src/lib/storage.ts` | Modify | Migrate stored campaigns to include `smartMenuPageId`. |
| `.env.example` | Modify | Add smart menu API environment variables. |
| `cloudflare/smart-menu-worker.ts` | Create | Worker API for create, update, fetch by ID, and public fetch by slug. |
| `cloudflare/migrations/0001_smart_menu_pages.sql` | Create | D1 schema for `smart_menu_pages`. |
| `docs/superpowers/cloudflare-smart-menu-setup.md` | Create | Manual Cloudflare setup and deployment notes. |
| `src/components/SmartMenuEditor.tsx` | Create | Operator editor and publish/update panel. |
| `src/components/SmartMenuPage.tsx` | Create | Public customer-facing `/m/:slug` page. |
| `src/App.tsx` | Modify | Route `/m/:slug` outside `LoginGate` and mount `SmartMenuEditor` in the operator sidebar. |
| `src/index.css` | Modify | Add public smart menu page and editor styling. |

---

## Task 1: Core Smart Menu Types and Client

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/storage.ts`
- Create: `src/lib/smartMenu.ts`
- Modify: `.env.example`

- [ ] **Step 1: Extend shared types**

In `src/types.ts`, keep existing `Lead` and `Campaign` fields and add the new smart menu types:

```ts
export interface Campaign {
  name: string;
  discount: string;
  duration: string;
  url: string;
  imageUrls: string[];
  smartMenuPageId?: string;
}

export interface SmartMenuPage {
  id: string;
  slug: string;
  campaignName: string;
  title: string;
  offerHeadline: string;
  offerDescription: string;
  imageUrls: string[];
  orderPhone: string;
  orderMessage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmartMenuDraft {
  id?: string;
  slug: string;
  campaignName: string;
  title: string;
  offerHeadline: string;
  offerDescription: string;
  imageUrls: string[];
  orderPhone: string;
  orderMessage: string;
  isActive: boolean;
}

export interface SmartMenuPublishResult {
  page: SmartMenuPage;
  publicPath: string;
}
```

- [ ] **Step 2: Update campaign storage defaults**

In both `src/lib/storage.ts` and `src/hooks/useLeads.ts`, ensure `DEFAULT_CAMPAIGN` includes `smartMenuPageId: undefined`. In `loadCampaign`, preserve the existing legacy `imageUrl` migration and return `{ ...DEFAULT_CAMPAIGN, ...loaded }`.

- [ ] **Step 3: Create `src/lib/smartMenu.ts`**

Create these exported functions and constants:

```ts
import type { Campaign, SmartMenuDraft, SmartMenuPage, SmartMenuPublishResult } from '../types';

const API_BASE = (import.meta.env.VITE_SMART_MENU_API_BASE ?? '/api/smart-menu').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_SMART_MENU_API_KEY ?? '';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function validateSlug(value: string): string | null {
  if (!value.trim()) return 'Smart link slug is required.';
  if (!SLUG_PATTERN.test(value)) return 'Use lowercase letters, numbers, and single hyphens only.';
  return null;
}

export function createDefaultSmartMenuDraft(campaign: Campaign): SmartMenuDraft {
  const slug = normalizeSlug(campaign.name || 'shalta-offer');
  return {
    id: campaign.smartMenuPageId,
    slug,
    campaignName: campaign.name || 'Al Shalta Campaign',
    title: 'Al Shalta Menu',
    offerHeadline: campaign.discount ? `${campaign.discount} off today` : 'Special offer today',
    offerDescription: campaign.duration ? `Valid for ${campaign.duration}.` : 'Open the menu and order through WhatsApp.',
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
  const phone = orderPhone.replace(/[^\d]/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(orderMessage)}`;
}

export async function publishSmartMenuPage(draft: SmartMenuDraft): Promise<SmartMenuPublishResult> {
  const slugError = validateSlug(draft.slug);
  if (slugError) throw new Error(slugError);

  const method = draft.id ? 'PUT' : 'POST';
  const url = draft.id ? `${API_BASE}/pages/${encodeURIComponent(draft.id)}` : `${API_BASE}/pages`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['X-Smart-Menu-Key'] = API_KEY;

  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(draft),
  });

  if (!response.ok) {
    if (response.status === 409) throw new Error('This smart link is already used. Try another slug.');
    if (response.status === 401 || response.status === 403) throw new Error('Smart menu publishing is not authorized. Check Cloudflare API key setup.');
    const text = await response.text();
    throw new Error(text || 'Failed to publish smart menu page.');
  }

  const page = (await response.json()) as SmartMenuPage;
  return { page, publicPath: getSmartMenuPublicPath(page.slug) };
}

export async function fetchSmartMenuPageBySlug(slug: string): Promise<SmartMenuPage> {
  const response = await fetch(`${API_BASE}/pages/by-slug/${encodeURIComponent(slug)}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('NOT_FOUND');
    if (response.status === 410) throw new Error('INACTIVE');
    throw new Error('LOAD_FAILED');
  }
  return (await response.json()) as SmartMenuPage;
}
```

- [ ] **Step 4: Update environment example**

Add to `.env.example`:

```env
VITE_SMART_MENU_API_BASE=/api/smart-menu
VITE_SMART_MENU_API_KEY=your-cloudflare-smart-menu-write-key
```

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 6: Commit**

```powershell
git add src/types.ts src/lib/storage.ts src/hooks/useLeads.ts src/lib/smartMenu.ts .env.example
git commit -m "feat: add smart menu core types and client"
```

---

## Task 2: Cloudflare Worker and D1 Schema

**Files:**
- Create: `cloudflare/smart-menu-worker.ts`
- Create: `cloudflare/migrations/0001_smart_menu_pages.sql`
- Create: `docs/superpowers/cloudflare-smart-menu-setup.md`

- [ ] **Step 1: Create D1 migration**

Create `cloudflare/migrations/0001_smart_menu_pages.sql` with:

```sql
CREATE TABLE IF NOT EXISTS smart_menu_pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  campaign_name TEXT NOT NULL,
  title TEXT NOT NULL,
  offer_headline TEXT NOT NULL,
  offer_description TEXT NOT NULL,
  image_urls_json TEXT NOT NULL,
  order_phone TEXT NOT NULL,
  order_message TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_smart_menu_pages_slug ON smart_menu_pages(slug);
```

- [ ] **Step 2: Create Worker implementation**

Create `cloudflare/smart-menu-worker.ts`. It must:

- Define `Env` with `SMART_MENU_DB: D1Database` and `SMART_MENU_API_KEY: string`.
- Support CORS for same-origin/simple deployments.
- Validate write requests using `X-Smart-Menu-Key`.
- Validate slug using `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.
- Implement:
  - `POST /api/smart-menu/pages`
  - `PUT /api/smart-menu/pages/:id`
  - `GET /api/smart-menu/pages/:id`
  - `GET /api/smart-menu/pages/by-slug/:slug`
- Return `409` for duplicate slugs.
- Return `410` for inactive public slug fetches.

- [ ] **Step 3: Document Cloudflare setup**

Create `docs/superpowers/cloudflare-smart-menu-setup.md` with exact operator steps:

```markdown
# Cloudflare Smart Menu Setup

## 1. Create D1 database

```powershell
npx.cmd wrangler d1 create shalta-smart-menu
```

Copy the returned database ID.

## 2. Apply migration

```powershell
npx.cmd wrangler d1 migrations apply shalta-smart-menu --local
npx.cmd wrangler d1 migrations apply shalta-smart-menu --remote
```

## 3. Configure Worker binding

Bind the D1 database as `SMART_MENU_DB` and set secret `SMART_MENU_API_KEY`.

```powershell
npx.cmd wrangler secret put SMART_MENU_API_KEY
```

## 4. Route API

Route the Worker or Pages Function to:

- `/api/smart-menu/*`

## 5. App env

Set:

```env
VITE_SMART_MENU_API_BASE=/api/smart-menu
VITE_SMART_MENU_API_KEY=<same write key>
```
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run build
```

Expected: build passes. Worker is not bundled by Vite but TypeScript syntax should be reviewable.

- [ ] **Step 5: Commit**

```powershell
git add cloudflare/smart-menu-worker.ts cloudflare/migrations/0001_smart_menu_pages.sql docs/superpowers/cloudflare-smart-menu-setup.md
git commit -m "feat: add Cloudflare smart menu API"
```

---

## Task 3: Operator Smart Menu Editor

**Files:**
- Create: `src/components/SmartMenuEditor.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Create editor component**

Create `SmartMenuEditor` with props:

```ts
interface Props {
  campaign: Campaign;
  onChangeCampaign: (campaign: Campaign) => void;
}
```

It must:

- Seed local draft from `createDefaultSmartMenuDraft(campaign)`.
- Keep draft `imageUrls` synchronized with `campaign.imageUrls`.
- Allow editing slug, title, offer headline, offer description, order phone, order message, and active status.
- Show warning if `imageUrls.length === 0`.
- Publish via `publishSmartMenuPage`.
- On success, update campaign with `url: publicPath` and `smartMenuPageId: page.id`.
- Show copy/open controls for the public path.
- Show readable loading and error states.

- [ ] **Step 2: Add editor to app**

In `src/App.tsx`, import `SmartMenuEditor` and mount it below `MessageBuilder` in the sidebar:

```tsx
<div className="sidebar-section">
  <SmartMenuEditor campaign={campaign} onChangeCampaign={setCampaign} />
</div>
```

- [ ] **Step 3: Add editor styles**

In `src/index.css`, add classes:

- `.smart-menu-editor`
- `.smart-menu-grid`
- `.smart-menu-field`
- `.smart-menu-actions`
- `.smart-menu-link`
- `.smart-menu-warning`
- `.smart-menu-error`
- `.smart-menu-success`

Use the existing premium operator visual language and keep controls touch-friendly.

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run build
```

Expected: build passes.

- [ ] **Step 5: Commit**

```powershell
git add src/components/SmartMenuEditor.tsx src/App.tsx src/index.css
git commit -m "feat: add smart menu editor"
```

---

## Task 4: Public Smart Menu Page Route

**Files:**
- Create: `src/components/SmartMenuPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Create public page component**

Create `SmartMenuPage` with prop:

```ts
interface Props {
  slug: string;
}
```

It must:

- Fetch the page with `fetchSmartMenuPageBySlug(slug)`.
- Show loading, not-found, expired, and failed states.
- Render the bold offer hero first.
- Render menu images below the hero.
- Use `buildSmartMenuWhatsAppUrl(page.orderPhone, page.orderMessage)` for the CTA.
- Hide broken images with `onError`.
- Avoid showing raw S3 URLs as primary content.

- [ ] **Step 2: Route `/m/:slug` outside login**

At the top of `App`, before returning `LoginGate`, derive:

```ts
const smartMenuMatch = window.location.pathname.match(/^\/m\/([a-z0-9-]+)$/);
if (smartMenuMatch) {
  return <SmartMenuPage slug={smartMenuMatch[1]} />;
}
```

Import `SmartMenuPage`.

- [ ] **Step 3: Add public page styles**

In `src/index.css`, add:

- `.smart-page`
- `.smart-page-hero`
- `.smart-page-brand`
- `.smart-page-offer`
- `.smart-page-cta`
- `.smart-page-gallery`
- `.smart-page-image`
- `.smart-page-state`

The first viewport should show the offer and CTA and hint at the menu gallery.

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run build
```

Expected: build passes.

- [ ] **Step 5: Commit**

```powershell
git add src/components/SmartMenuPage.tsx src/App.tsx src/index.css
git commit -m "feat: add public smart menu page"
```

---

## Task 5: Final Integration Verification

**Files:**
- Modify only if verification reveals a concrete bug in files touched by Tasks 1-4.

- [ ] **Step 1: Run build**

```powershell
npm.cmd run build
```

Expected: build passes.

- [ ] **Step 2: Run lint**

```powershell
npm.cmd run lint
```

Expected: lint passes, or any pre-existing lint baseline issue is documented with exact output.

- [ ] **Step 3: Manual smoke checklist**

Start dev server:

```powershell
npm.cmd run dev
```

Verify:

- Operator app still loads behind `LoginGate`.
- Smart Menu editor renders in the sidebar.
- Missing slug blocks publish client-side.
- Invalid slug blocks publish client-side.
- Publish failure keeps form data and shows a readable error when API is not configured.
- `/m/demo-offer` shows a public loading/failure state instead of the operator login.

- [ ] **Step 4: Commit fixes if needed**

If fixes were required:

```powershell
git add <changed-files>
git commit -m "fix: complete smart menu integration"
```

If no fixes were required, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Clean `/m/<slug>` campaign links: Tasks 1, 3, and 4.
- Cloudflare Worker + D1: Task 2.
- Smart Menu Page editor: Task 3.
- Public offer-first customer page: Task 4.
- Custom WhatsApp CTA: Tasks 1 and 4.
- Existing image URLs reused: Tasks 1, 3, and 4.
- Error states: Tasks 1, 2, 3, and 4.
- Testing/build verification: every task plus Task 5.

Placeholder scan: no banned placeholder markers are allowed in this plan.

Scope check: AI menu OCR, cart/order checkout, per-customer links, full analytics, and automatic WhatsApp image attachment stay out of scope.

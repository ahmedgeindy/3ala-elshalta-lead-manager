# Smart Menu Campaign Links Design

## Purpose

Replace suspicious-looking raw image URLs in WhatsApp campaign messages with a clean campaign-specific smart menu link on the current app domain.

The operator should publish a short link such as `/m/summer-offer`, send that link in WhatsApp, and give customers a trustworthy offer-first page with menu images and a customized WhatsApp order button.

## Decisions

- Main approach: Cloudflare-hosted smart campaign page data.
- Public link style: current app domain path, `/m/<slug>`.
- Customer page layout: bold offer hero first, menu images below.
- Content source: a small Smart Menu Page editor inside the existing operator app.
- Storage/API: Cloudflare Worker with D1.
- Order CTA behavior: operator customizes the WhatsApp message per campaign.
- Image behavior: store existing uploaded image URLs; do not try to pre-attach WhatsApp images automatically.

## Product Flow

The existing campaign workflow stays intact. The operator still imports leads, configures campaign fields, uploads menu or offer images, edits the WhatsApp message, and sends messages.

A new Smart Menu Page editor is added near Campaign Settings or Message Builder. It lets the operator set:

- Slug
- Page title
- Offer headline
- Offer description
- Menu/offer images
- Restaurant order phone
- Custom WhatsApp CTA message
- Active/inactive status

When the operator clicks Publish Smart Link, the app saves the smart menu page through the Cloudflare Worker API. The API returns the public path, for example `/m/summer-offer`. The app writes that link into the campaign `url` field so existing `{{url}}` message templates use the branded campaign link.

The customer opens `/m/<slug>`. The page shows:

- Restaurant identity
- Campaign offer headline
- Short offer description
- Primary Order on WhatsApp button
- Menu image gallery
- Phone/location/trust details if available

The WhatsApp button opens a message using the operator's custom CTA text.

## Architecture

The system has four parts:

- React operator app: adds the Smart Menu Page editor, publish state, and link copy/open controls.
- React public route: adds `/m/:slug` to render the customer smart menu page.
- Cloudflare Worker API: creates, updates, fetches, and optionally tracks smart menu pages.
- Cloudflare D1 database: stores campaign page records and leaves room for analytics tables.

The existing image upload flow remains separate. Smart menu records store public image URLs in `imageUrls`, not image binaries.

The current app domain should route both the operator app and public smart menu pages. If deployed through Cloudflare Pages, the Worker can be connected through Pages Functions or a Worker route such as `/api/smart-menu/*`.

## Data Model

```ts
interface SmartMenuPage {
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
```

D1 table shape:

```sql
CREATE TABLE smart_menu_pages (
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
```

Optional later tracking table:

```sql
CREATE TABLE smart_menu_events (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  metadata_json TEXT,
  FOREIGN KEY (page_id) REFERENCES smart_menu_pages(id)
);
```

## API Design

Initial endpoints:

- `POST /api/smart-menu/pages`: create or publish a page.
- `PUT /api/smart-menu/pages/:id`: update an existing page.
- `GET /api/smart-menu/pages/by-slug/:slug`: fetch a public active page.
- `GET /api/smart-menu/pages/:id`: fetch an operator page for editing.

Tracking endpoints can be added later:

- `POST /api/smart-menu/pages/:id/events/open`
- `POST /api/smart-menu/pages/:id/events/whatsapp-click`

Operator write endpoints must require an API key or existing app-auth mechanism. Public fetch by slug must not expose private operator-only fields.

## UI Components

Add these units:

- `SmartMenuEditor`: form for slug, title, offer text, order phone, order message, active status, and image selection.
- `SmartMenuPublishPanel`: publish/update button, loading state, error state, final link display, copy link button, open preview button.
- `SmartMenuPage`: public customer-facing route for `/m/:slug`.
- `SmartMenuGallery`: displays menu/offer images on the public page.
- `SmartMenuCta`: WhatsApp order button with encoded custom message.

Existing components remain:

- `CampaignPanel` keeps core campaign fields.
- `ImageUpload` remains the menu image source.
- `MessageBuilder` keeps using `{{url}}`, but the published smart link can populate `campaign.url`.

## Customer Page Design

Use the selected bold offer hero direction.

The first viewport should contain:

- Al Shalta identity
- Offer headline
- Offer description
- Main WhatsApp order button
- A visible hint of the menu gallery below the fold

The page should avoid a "hacker" or file-hosting feel. Do not show S3 URLs as primary content. The menu images should appear as branded page content, not as raw attachments.

## Error Handling

Operator publishing:

- Missing slug: show a required-field error.
- Invalid slug: allow lowercase letters, numbers, and hyphens only.
- Duplicate slug: tell the operator the link is already used and suggest editing it.
- No images: allow publishing, but show a warning because menu images improve trust.
- API failure: keep local form data and show a retry action.
- Auth failure: show setup/authentication error, not a generic network error.

Customer page:

- Missing slug: show a clean not-found page.
- Inactive campaign: show a polite expired-offer page.
- API failure: show retry text and the restaurant phone if embedded fallback data is available.
- Broken image URL: hide that image and keep the rest of the page usable.

## Testing

Unit tests should cover:

- Slug validation.
- WhatsApp CTA link encoding.
- Smart menu API client success and failure handling.
- Campaign-to-smart-page data mapping.

Integration or manual tests should cover:

- Publish a page, receive `/m/<slug>`, and update `campaign.url`.
- Open `/m/<slug>` from a fresh browser session and see the public page.
- Tap Order on WhatsApp and verify the phone/message are correct.
- Duplicate slug error.
- Inactive page behavior.
- Broken image behavior.

Build verification:

- `npm run build`
- `npm run lint` if the current lint baseline is clean enough to be meaningful.

## Scope Boundaries

In scope:

- Smart menu page editor.
- Cloudflare Worker API.
- D1 storage.
- Public customer route.
- Publish/update flow.
- Custom WhatsApp CTA message.
- Clean campaign URL insertion into the existing message template.

Out of scope for the first implementation:

- AI menu OCR or automatic item extraction.
- Cart/order checkout.
- Payment.
- Per-customer unique links.
- Full analytics dashboard.
- Automatic WhatsApp image attachment.

## Open Setup Assumptions

- The user has a Cloudflare account.
- The current deployed app domain can route `/m/<slug>` and `/api/smart-menu/*`.
- The current image upload URLs are publicly readable.
- The operator app can keep its existing password/login gate for operator-only screens.

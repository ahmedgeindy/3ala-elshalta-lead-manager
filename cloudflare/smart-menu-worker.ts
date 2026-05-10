interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Result {
  success: boolean;
  error?: string;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface Env {
  SMART_MENU_DB: D1Database;
  SMART_MENU_API_KEY: string;
}

interface SmartMenuPayload {
  slug?: unknown;
  campaignName?: unknown;
  title?: unknown;
  offerHeadline?: unknown;
  offerDescription?: unknown;
  imageUrls?: unknown;
  orderPhone?: unknown;
  orderMessage?: unknown;
  isActive?: unknown;
}

interface ParsedSmartMenuPayload {
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

interface SmartMenuPageRow {
  id: string;
  slug: string;
  campaign_name: string;
  title: string;
  offer_headline: string;
  offer_description: string;
  image_urls_json: string;
  order_phone: string;
  order_message: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const API_PREFIX = '/api/smart-menu';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Smart-Menu-Key',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

function notFound(): Response {
  return textResponse('Not found', 404);
}

function safeDecodeRouteParam(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringField(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function parseImageUrls(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string' && item.trim())) {
    throw new Error('imageUrls must be a string array.');
  }

  return value.map((item) => item.trim());
}

function parseIsActive(value: unknown): boolean {
  if (value === undefined) {
    return true;
  }

  if (typeof value !== 'boolean') {
    throw new Error('isActive must be a boolean.');
  }

  return value;
}

function parsePayload(value: unknown): ParsedSmartMenuPayload {
  if (!isObject(value)) {
    throw new Error('Request body must be a JSON object.');
  }

  const payload = value as SmartMenuPayload;
  const slug = stringField(payload.slug, 'slug');
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error('Invalid slug.');
  }

  return {
    slug,
    campaignName: stringField(payload.campaignName, 'campaignName'),
    title: stringField(payload.title, 'title'),
    offerHeadline: stringField(payload.offerHeadline, 'offerHeadline'),
    offerDescription: stringField(payload.offerDescription, 'offerDescription'),
    imageUrls: parseImageUrls(payload.imageUrls),
    orderPhone: stringField(payload.orderPhone, 'orderPhone'),
    orderMessage: stringField(payload.orderMessage, 'orderMessage'),
    isActive: parseIsActive(payload.isActive),
  };
}

function mapRow(row: SmartMenuPageRow): SmartMenuPage {
  return {
    id: row.id,
    slug: row.slug,
    campaignName: row.campaign_name,
    title: row.title,
    offerHeadline: row.offer_headline,
    offerDescription: row.offer_description,
    imageUrls: JSON.parse(row.image_urls_json) as string[],
    orderPhone: row.order_phone,
    orderMessage: row.order_message,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
}

async function sha256(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(digest);
}

async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  const expected = env.SMART_MENU_API_KEY;
  const provided = request.headers.get('X-Smart-Menu-Key') ?? '';
  if (!expected || !provided) {
    return false;
  }

  const [expectedHash, providedHash] = await Promise.all([sha256(expected), sha256(provided)]);
  let difference = expectedHash.length ^ providedHash.length;
  const length = Math.max(expectedHash.length, providedHash.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (expectedHash[index] ?? 0) ^ (providedHash[index] ?? 0);
  }

  return difference === 0;
}

async function requireWriteKey(request: Request, env: Env): Promise<Response | null> {
  if (await isAuthorized(request, env)) {
    return null;
  }

  return textResponse('Unauthorized', 401);
}

async function getPageById(env: Env, id: string): Promise<SmartMenuPageRow | null> {
  return env.SMART_MENU_DB.prepare(
    `SELECT id, slug, campaign_name, title, offer_headline, offer_description, image_urls_json,
      order_phone, order_message, is_active, created_at, updated_at
     FROM smart_menu_pages
     WHERE id = ?`,
  ).bind(id).first<SmartMenuPageRow>();
}

async function getPageBySlug(env: Env, slug: string): Promise<SmartMenuPageRow | null> {
  return env.SMART_MENU_DB.prepare(
    `SELECT id, slug, campaign_name, title, offer_headline, offer_description, image_urls_json,
      order_phone, order_message, is_active, created_at, updated_at
     FROM smart_menu_pages
     WHERE slug = ?`,
  ).bind(slug).first<SmartMenuPageRow>();
}

async function slugBelongsToAnotherPage(env: Env, slug: string, pageId: string): Promise<boolean> {
  const row = await env.SMART_MENU_DB.prepare('SELECT id FROM smart_menu_pages WHERE slug = ? AND id != ?')
    .bind(slug, pageId)
    .first<{ id: string }>();
  return row !== null;
}

function isDuplicateSlugError(result: D1Result, error: unknown): boolean {
  const message = error instanceof Error ? error.message : result.error ?? '';
  return message.toLowerCase().includes('unique') || message.toLowerCase().includes('constraint');
}

async function createPage(request: Request, env: Env): Promise<Response> {
  const authResponse = await requireWriteKey(request, env);
  if (authResponse) {
    return authResponse;
  }

  let payload: ParsedSmartMenuPayload;
  try {
    payload = parsePayload(await readJson(request));
  } catch (error) {
    return textResponse(error instanceof Error ? error.message : 'Invalid request.', 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    const result = await env.SMART_MENU_DB.prepare(
      `INSERT INTO smart_menu_pages (
        id, slug, campaign_name, title, offer_headline, offer_description, image_urls_json,
        order_phone, order_message, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        payload.slug,
        payload.campaignName,
        payload.title,
        payload.offerHeadline,
        payload.offerDescription,
        JSON.stringify(payload.imageUrls),
        payload.orderPhone,
        payload.orderMessage,
        payload.isActive ? 1 : 0,
        now,
        now,
      )
      .run();

    if (!result.success) {
      if (isDuplicateSlugError(result, null)) {
        return textResponse('Duplicate slug', 409);
      }

      return textResponse('Failed to create smart menu page.', 500);
    }
  } catch (error) {
    if (isDuplicateSlugError({ success: false }, error)) {
      return textResponse('Duplicate slug', 409);
    }

    return textResponse('Failed to create smart menu page.', 500);
  }

  const row = await getPageById(env, id);
  return row ? jsonResponse(mapRow(row), 201) : textResponse('Failed to create smart menu page.', 500);
}

async function updatePage(request: Request, env: Env, id: string): Promise<Response> {
  const authResponse = await requireWriteKey(request, env);
  if (authResponse) {
    return authResponse;
  }

  let payload: ParsedSmartMenuPayload;
  try {
    payload = parsePayload(await readJson(request));
  } catch (error) {
    return textResponse(error instanceof Error ? error.message : 'Invalid request.', 400);
  }

  const existing = await getPageById(env, id);
  if (!existing) {
    return notFound();
  }

  if (await slugBelongsToAnotherPage(env, payload.slug, id)) {
    return textResponse('Duplicate slug', 409);
  }

  const now = new Date().toISOString();
  try {
    const result = await env.SMART_MENU_DB.prepare(
      `UPDATE smart_menu_pages
       SET slug = ?, campaign_name = ?, title = ?, offer_headline = ?, offer_description = ?,
         image_urls_json = ?, order_phone = ?, order_message = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(
        payload.slug,
        payload.campaignName,
        payload.title,
        payload.offerHeadline,
        payload.offerDescription,
        JSON.stringify(payload.imageUrls),
        payload.orderPhone,
        payload.orderMessage,
        payload.isActive ? 1 : 0,
        now,
        id,
      )
      .run();

    if (!result.success) {
      if (isDuplicateSlugError(result, null)) {
        return textResponse('Duplicate slug', 409);
      }

      return textResponse('Failed to update smart menu page.', 500);
    }
  } catch (error) {
    if (isDuplicateSlugError({ success: false }, error)) {
      return textResponse('Duplicate slug', 409);
    }

    return textResponse('Failed to update smart menu page.', 500);
  }

  const row = await getPageById(env, id);
  return row ? jsonResponse(mapRow(row)) : notFound();
}

async function fetchPageById(request: Request, env: Env, id: string): Promise<Response> {
  const authResponse = await requireWriteKey(request, env);
  if (authResponse) {
    return authResponse;
  }

  const row = await getPageById(env, id);
  return row ? jsonResponse(mapRow(row)) : notFound();
}

async function fetchPublicPageBySlug(env: Env, slug: string): Promise<Response> {
  if (!SLUG_PATTERN.test(slug)) {
    return notFound();
  }

  const row = await getPageBySlug(env, slug);
  if (!row) {
    return notFound();
  }

  if (row.is_active !== 1) {
    return textResponse('Smart menu page is inactive.', 410);
  }

  return jsonResponse(mapRow(row));
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');
  const publicSlugMatch = path.match(/^\/api\/smart-menu\/pages\/by-slug\/([^/]+)$/);
  const pageIdMatch = path.match(/^\/api\/smart-menu\/pages\/([^/]+)$/);

  if (request.method === 'POST' && path === `${API_PREFIX}/pages`) {
    return createPage(request, env);
  }

  if (publicSlugMatch && request.method === 'GET') {
    const slug = safeDecodeRouteParam(publicSlugMatch[1]);
    return slug === null ? textResponse('Invalid route parameter.', 400) : fetchPublicPageBySlug(env, slug);
  }

  if (pageIdMatch && request.method === 'GET') {
    const id = safeDecodeRouteParam(pageIdMatch[1]);
    return id === null ? textResponse('Invalid route parameter.', 400) : fetchPageById(request, env, id);
  }

  if (pageIdMatch && request.method === 'PUT') {
    const id = safeDecodeRouteParam(pageIdMatch[1]);
    return id === null ? textResponse('Invalid route parameter.', 400) : updatePage(request, env, id);
  }

  return notFound();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch {
      return textResponse('Internal server error', 500);
    }
  },
};

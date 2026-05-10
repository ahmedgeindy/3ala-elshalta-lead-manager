export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    };

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const jsonHeaders = {
      "Content-Type": "application/json",
      ...corsHeaders,
    };

    try {
      if (method === "POST" && path === "/api/smart-menu/pages") {
        const authError = requireAuth(request, env);
        if (authError) return addCors(authError, corsHeaders);

        const body = await request.json<Record<string, unknown>>();
        const validation = validateCreateBody(body);
        if (validation) return addCors(validation, corsHeaders);

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const imageUrlsJson = JSON.stringify(body.imageUrls);

        try {
          await env.DB.prepare(
            `INSERT INTO smart_menu_pages (id, slug, campaign_name, title, offer_headline, offer_description, image_urls_json, order_phone, order_message, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              id,
              body.slug,
              body.campaignName,
              body.title,
              body.offerHeadline,
              body.offerDescription,
              imageUrlsJson,
              body.orderPhone,
              body.orderMessage,
              body.isActive ?? 1,
              now,
              now
            )
            .run();
        } catch (e: any) {
          if (e?.message?.includes("UNIQUE constraint")) {
            return addCors(
              Response.json({ error: "Slug already exists" }, { status: 409 }),
              corsHeaders
            );
          }
          throw e;
        }

        const row = await env.DB.prepare(`SELECT * FROM smart_menu_pages WHERE id = ?`)
          .bind(id)
          .first();

        return addCors(
          Response.json(toCamelCase(row!), { status: 201 }),
          corsHeaders
        );
      }

      if (method === "PUT" && path.match(/^\/api\/smart-menu\/pages\/[^/]+$/)) {
        const authError = requireAuth(request, env);
        if (authError) return addCors(authError, corsHeaders);

        const id = path.split("/").pop()!;
        const body = await request.json<Record<string, unknown>>();

        const existing = await env.DB.prepare(`SELECT * FROM smart_menu_pages WHERE id = ?`)
          .bind(id)
          .first();
        if (!existing) {
          return addCors(
            Response.json({ error: "Page not found" }, { status: 404 }),
            corsHeaders
          );
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (body.slug !== undefined) {
          updates.push("slug = ?");
          values.push(body.slug);
        }
        if (body.campaignName !== undefined) {
          updates.push("campaign_name = ?");
          values.push(body.campaignName);
        }
        if (body.title !== undefined) {
          updates.push("title = ?");
          values.push(body.title);
        }
        if (body.offerHeadline !== undefined) {
          updates.push("offer_headline = ?");
          values.push(body.offerHeadline);
        }
        if (body.offerDescription !== undefined) {
          updates.push("offer_description = ?");
          values.push(body.offerDescription);
        }
        if (body.imageUrls !== undefined) {
          updates.push("image_urls_json = ?");
          values.push(JSON.stringify(body.imageUrls));
        }
        if (body.orderPhone !== undefined) {
          updates.push("order_phone = ?");
          values.push(body.orderPhone);
        }
        if (body.orderMessage !== undefined) {
          updates.push("order_message = ?");
          values.push(body.orderMessage);
        }
        if (body.isActive !== undefined) {
          updates.push("is_active = ?");
          values.push(body.isActive ? 1 : 0);
        }

        if (updates.length > 0) {
          updates.push("updated_at = ?");
          values.push(new Date().toISOString());
          values.push(id);

          await env.DB.prepare(
            `UPDATE smart_menu_pages SET ${updates.join(", ")} WHERE id = ?`
          )
            .bind(...values)
            .run();
        }

        const updated = await env.DB.prepare(`SELECT * FROM smart_menu_pages WHERE id = ?`)
          .bind(id)
          .first();

        return addCors(
          Response.json(toCamelCase(updated!)),
          corsHeaders
        );
      }

      if (method === "GET" && path.match(/^\/api\/smart-menu\/pages\/by-slug\//)) {
        const slug = decodeURIComponent(path.split("/by-slug/")[1]);

        const row = await env.DB.prepare(
          `SELECT * FROM smart_menu_pages WHERE slug = ? AND is_active = 1`
        )
          .bind(slug)
          .first();

        if (!row) {
          return addCors(
            Response.json({ error: "Page not found" }, { status: 404 }),
            corsHeaders
          );
        }

        const publicPage = toPublicCamelCase(row);
        return addCors(Response.json(publicPage), corsHeaders);
      }

      if (method === "GET" && path.match(/^\/api\/smart-menu\/pages\/[^/]+$/)) {
        const authError = requireAuth(request, env);
        if (authError) return addCors(authError, corsHeaders);

        const id = path.split("/").pop()!;

        const row = await env.DB.prepare(`SELECT * FROM smart_menu_pages WHERE id = ?`)
          .bind(id)
          .first();

        if (!row) {
          return addCors(
            Response.json({ error: "Page not found" }, { status: 404 }),
            corsHeaders
          );
        }

        return addCors(Response.json(toCamelCase(row)), corsHeaders);
      }

      return addCors(
        Response.json({ error: "Not found" }, { status: 404 }),
        corsHeaders
      );
    } catch (err: any) {
      return addCors(
        Response.json({ error: "Internal server error", detail: err?.message }, { status: 500 }),
        corsHeaders
      );
    }
  },
} satisfies ExportedHandler<Env>;

function requireAuth(request: Request, env: Env): Response | null {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey || apiKey !== env.API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function validateCreateBody(body: Record<string, unknown>): Response | null {
  const required = ["slug", "campaignName", "title", "offerHeadline", "offerDescription", "orderPhone", "orderMessage"];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string") {
      return Response.json({ error: `Missing or invalid field: ${field}` }, { status: 400 });
    }
  }
  if (!Array.isArray(body.imageUrls)) {
    return Response.json({ error: "Missing or invalid field: imageUrls" }, { status: 400 });
  }
  return null;
}

function toCamelCase(row: Record<string, any>): Record<string, any> {
  return {
    id: row.id,
    slug: row.slug,
    campaignName: row.campaign_name,
    title: row.title,
    offerHeadline: row.offer_headline,
    offerDescription: row.offer_description,
    imageUrls: JSON.parse(row.image_urls_json),
    orderPhone: row.order_phone,
    orderMessage: row.order_message,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicCamelCase(row: Record<string, any>): Record<string, any> {
  return {
    slug: row.slug,
    campaignName: row.campaign_name,
    title: row.title,
    offerHeadline: row.offer_headline,
    offerDescription: row.offer_description,
    imageUrls: JSON.parse(row.image_urls_json),
    orderPhone: row.order_phone,
    orderMessage: row.order_message,
  };
}

function addCors(response: Response, corsHeaders: Record<string, string>): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
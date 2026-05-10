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

CREATE INDEX idx_smart_menu_slug ON smart_menu_pages(slug);
CREATE INDEX idx_smart_menu_active ON smart_menu_pages(is_active);
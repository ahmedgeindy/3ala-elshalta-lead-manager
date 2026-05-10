# Cloudflare Smart Menu Setup

## 1. Create D1 Database

```powershell
npx.cmd wrangler d1 create shalta-smart-menu
```

Copy the returned database ID for the Worker binding configuration.

## 2. Apply Migration

Before running migrations, configure Wrangler to use the committed migration directory:

```toml
[[d1_databases]]
binding = "SMART_MENU_DB"
database_name = "shalta-smart-menu"
database_id = "<database-id-from-create-command>"
migrations_dir = "cloudflare/migrations"
```

Run the migration locally first:

```powershell
npx.cmd wrangler d1 migrations apply shalta-smart-menu --local
```

Apply the same migration to the remote D1 database:

```powershell
npx.cmd wrangler d1 migrations apply shalta-smart-menu --remote
```

## 3. Configure Worker Binding

Bind the D1 database as `SMART_MENU_DB` in the Worker configuration.

Set the write API key as a Worker secret:

```powershell
npx.cmd wrangler secret put SMART_MENU_API_KEY
```

## 4. Route API

Route the Worker to:

```text
/api/smart-menu/*
```

## 5. Configure App Environment

Set only the Smart Menu API base in the Vite app environment:

```env
VITE_SMART_MENU_API_BASE=/api/smart-menu
```

The Cloudflare write key is not stored in the Vite build. The operator enters it in the Smart Menu editor, and that browser stores it locally. Publish and update requests send it as `X-Smart-Menu-Key`.

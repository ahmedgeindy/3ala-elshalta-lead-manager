# Menu Image Upload (S3 + Lambda) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual image URL input with a drag-and-drop upload component that compresses the image client-side, uploads to S3 via a Lambda Function URL, and stores the permanent public URL in the campaign.

**Architecture:** The browser compresses the selected image (max 1200px wide, JPEG 85% quality) using Canvas API, then sends the base64 to a Lambda Function URL. The Lambda validates an API key, uploads the image to a public S3 bucket, and returns the permanent URL. The app stores that URL in `campaign.imageUrl` and includes it in WhatsApp messages. Lambda is deployed via AWS Console (manual one-time setup, ~10 min).

**Tech Stack:** React 18, Canvas API for client-side compression, AWS Lambda (Node.js 20) for upload proxy, S3 for storage, Phosphor Icons for UI.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/uploadImage.ts` | **Create** | Compress image + call Lambda upload function |
| `src/components/ImageUpload.tsx` | **Create** | Drag-and-drop + file picker upload component |
| `src/components/MessageBuilder.tsx` | **Modify** | Replace Image URL text input with `ImageUpload` component |
| `src/components/BulkSendQueue.tsx` | **Modify** | Show image thumbnail from `campaign.imageUrl` in send preview |
| `docs/superpowers/aws-setup-guide.md` | **Create** | Step-by-step AWS Console instructions for S3 + Lambda |

**AWS resources** (created manually in Console, documented in Task 1):
- S3 bucket: `shalta-menu-images` (us-east-1, public read)
- Lambda: `shalta-upload-image` (Node.js 20, Function URL with CORS)

---

## Task 1: Create AWS setup guide

**Files:**
- Create: `docs/superpowers/aws-setup-guide.md`

This task documents the manual AWS Console steps. The engineer performs these once.

- [ ] **Step 1: Create the AWS setup guide file**

Create `docs/superpowers/aws-setup-guide.md` with these exact instructions:

```markdown
# AWS Setup Guide: S3 Bucket + Lambda Upload Function

## 1. Create S3 Bucket

1. Go to https://s3.console.aws.amazon.com/s3/home?region=us-east-1
2. Click **Create bucket**
3. Bucket name: `shalta-menu-images`
4. Region: **US East (N. Virginia)**
5. Under **Object Ownership**, choose **ACLs enabled** and **Bucket owner preferred**
6. Under **Block Public Access settings**, uncheck **Block all public access** and acknowledge the warning
7. Click **Create bucket**
8. Open the bucket → **Permissions** tab → **Bucket policy**, paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::shalta-menu-images/*"
    }
  ]
}
```

9. Click **Save changes**

## 2. Create Lambda Function

1. Go to https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions
2. Click **Create function**
3. Choose **Author from scratch**
4. Function name: `shalta-upload-image`
5. Runtime: **Node.js 20.x**
6. Architecture: **x86_64**
7. Click **Create function**

## 3. Add Lambda Code

1. In the Lambda console, scroll to **Code source**
2. Replace `index.mjs` with the following code:

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({ region: 'us-east-1' });
const BUCKET = 'shalta-menu-images';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const API_KEY = process.env.UPLOAD_API_KEY || 'changeme';

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '*';

  if (event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-Api-Key'];
  if (apiKey !== API_KEY) {
    return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': origin }, body: 'Unauthorized' };
  }

  if (!event.body) {
    return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': origin }, body: 'Missing body' };
  }

  try {
    const { image, contentType, filename } = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body);

    if (!ALLOWED_TYPES.includes(contentType)) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': origin }, body: 'Invalid content type' };
    }

    if (!image || image.length > MAX_SIZE) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': origin }, body: 'Image too large (max 5MB)' };
    }

    const buffer = Buffer.from(image, 'base64');
    const key = `menu/${Date.now()}-${filename || 'image.jpg'}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    }));

    const url = `https://${BUCKET}.s3.amazonaws.com/${key}`;
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    };
  } catch (err) {
    console.error('Upload error:', err);
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': origin }, body: 'Upload failed' };
  }
};
```

3. Click **Deploy**

## 4. Configure Lambda Environment

1. Go to **Configuration** → **Environment variables**
2. Add: Key = `UPLOAD_API_KEY`, Value = *(generate a random 32+ char string, e.g. `shalta_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)*
3. Click **Save**
4. **Write down this API key** — you'll need it for the app's `.env.local`

## 5. Create Lambda Function URL

1. Go to **Configuration** → **Function URL**
2. Click **Create function URL**
3. Auth type: **NONE** (we use our own API key)
4. CORS: check **Enable CORS**
5. Click **Save**
6. **Copy the Function URL** — it looks like `https://xxxxxxxxx.lambda-url.us-east-1.on.aws/`
7. **Write down this URL** — you'll need it for the app's `.env.local`

## 6. Install AWS SDK in Lambda

1. In the Lambda code editor, scroll down to **Layers** or open the terminal
2. The AWS SDK v3 modules (`@aws-sdk/client-s3`) are available by default in the Node.js 20 runtime
3. If deployment fails with missing modules, create a Deployment Package:
   - Create a local folder, run `npm init -y && npm install @aws-sdk/client-s3`
   - Zip it up and upload via **Upload from** → **.zip file**

## 7. Add Vite environment variables

In your local `shalta-app/.env.local`, add:

```
VITE_APP_PASSWORD=your-password-here
VITE_UPLOAD_API_KEY=shalta_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
VITE_UPLOAD_FUNCTION_URL=https://xxxxxxxxx.lambda-url.us-east-1.on.aws/
```

For Amplify Console deployment, add these same variables in:
- **App settings** → **Environment variables**

For GitHub Actions, add them as repository secrets:
```bash
gh secret set VITE_UPLOAD_API_KEY --body "your-api-key-here"
gh secret set VITE_UPLOAD_FUNCTION_URL --body "your-function-url-here"
```

And update `.github/workflows/deploy.yml` Build step:
```yaml
- name: Build
  env:
    VITE_APP_PASSWORD: ${{ secrets.VITE_APP_PASSWORD }}
    VITE_UPLOAD_API_KEY: ${{ secrets.VITE_UPLOAD_API_KEY }}
    VITE_UPLOAD_FUNCTION_URL: ${{ secrets.VITE_UPLOAD_FUNCTION_URL }}
  run: npm run build
```
```

- [ ] **Step 2: Create the directory if needed**

```bash
mkdir -p docs/superpowers
```

- [ ] **Step 3: Commit the guide**

```bash
git add docs/superpowers/aws-setup-guide.md
git commit -m "docs: add AWS S3 + Lambda setup guide for menu image upload"
```

---

## Task 2: Create uploadImage utility

**Files:**
- Create: `src/lib/uploadImage.ts`

This module handles client-side image compression and upload to Lambda.

- [ ] **Step 1: Create `src/lib/uploadImage.ts`**

```ts
const FUNCTION_URL = import.meta.env.VITE_UPLOAD_FUNCTION_URL ?? '';
const API_KEY = import.meta.env.VITE_UPLOAD_API_KEY ?? '';

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.85;
const MAX_DATA_SIZE = 5 * 1024 * 1024;

interface UploadResult {
  url: string;
  error?: never;
}

interface UploadError {
  url?: never;
  error: string;
}

function compressImage(file: File): Promise<{ data: string; contentType: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      img.src = reader.result as string;
    };

    img.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);

      const contentType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = contentType === 'image/jpeg' ? JPEG_QUALITY : undefined;
      const dataUrl = canvas.toDataURL(contentType, quality);
      const base64 = dataUrl.split(',')[1];

      if (!base64) {
        reject(new Error('Failed to compress image'));
        return;
      }

      const ext = contentType === 'image/png' ? 'png' : 'jpg';
      const filename = `menu-${Date.now()}.${ext}`;

      resolve({ data: base64, contentType, filename });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File): Promise<UploadResult | UploadError> {
  if (!FUNCTION_URL || !API_KEY) {
    return { error: 'Image upload is not configured. Set VITE_UPLOAD_FUNCTION_URL and VITE_UPLOAD_API_KEY.' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Unsupported file type. Use JPEG, PNG, or WebP.' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: 'File too large. Maximum 10MB before compression.' };
  }

  try {
    const { data, contentType, filename } = await compressImage(file);

    if (data.length > MAX_DATA_SIZE) {
      return { error: 'Compressed image is still too large. Try a smaller image.' };
    }

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
      },
      body: JSON.stringify({ image: data, contentType, filename }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { error: 'Upload authentication failed. Check your API key.' };
      }
      const text = await response.text();
      return { error: `Upload failed: ${text}` };
    }

    const result = await response.json();
    return { url: result.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed unexpectedly.' };
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd shalta-app && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/uploadImage.ts
git commit -m "feat: add client-side image compression and Lambda upload utility"
```

---

## Task 3: Create ImageUpload component

**Files:**
- Create: `src/components/ImageUpload.tsx`

This component replaces the plain URL text input in MessageBuilder with a full drag-and-drop + file picker + URL fallback upload UI.

- [ ] **Step 1: Create `src/components/ImageUpload.tsx`**

```tsx
import { useState, useRef, useCallback } from 'react';
import { Image, X, SpinnerGap, Warning } from '@phosphor-icons/react';
import { uploadImage } from '../lib/uploadImage';

interface Props {
  imageUrl: string;
  onChangeUrl: (url: string) => void;
}

export function ImageUpload({ imageUrl, onChangeUrl }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);

    const result = await uploadImage(file);

    if ('url' in result) {
      onChangeUrl(result.url);
    } else {
      setError(result.error);
    }

    setUploading(false);
  }, [onChangeUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) handleFile(file);
        return;
      }
    }
  }, [handleFile]);

  const clear = () => {
    onChangeUrl('');
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2" onPaste={handlePaste}>
      <label style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        Offer Image
      </label>

      {!imageUrl && !uploading ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            display: 'block',
            borderRadius: 'var(--radius-md)',
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-medium)'}`,
            background: dragging ? 'var(--accent-muted)' : 'rgba(255,255,255,0.03)',
            padding: '20px 16px',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
            textAlign: 'center',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />
          <Image size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>
            Drop menu image here
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            or click to browse · JPEG, PNG, WebP · max 10MB
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, opacity: 0.6 }}>
            You can also paste from clipboard
          </div>
        </label>
      ) : uploading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '24px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <SpinnerGap size={20} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Uploading & compressing...</span>
        </div>
      ) : (
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-medium)',
        }}>
          <img
            src={imageUrl}
            alt="Offer"
            style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'cover' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <button
            onClick={clear}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(233,69,96,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
          >
            <X size={12} style={{ color: '#fff' }} />
          </button>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '4px 8px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            fontSize: 9,
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'var(--font-mono)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            direction: 'ltr',
          }}>
            {imageUrl}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#f87171',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
        }}>
          <Warning size={13} />
          {error}
        </div>
      )}

      {!imageUrl && !uploading && !error && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 10,
              padding: '2px 4px',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Or paste an image URL instead
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify Phosphor icon is available**

Check that `SpinnerGap` exists in `@phosphor-icons/react`. It should — it's a standard Phosphor icon. If TypeScript fails, replace `SpinnerGap` with `CircleNotch` which is definitely available.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd shalta-app && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ImageUpload.tsx
git commit -m "feat: add ImageUpload component with drag-and-drop, compress, and upload"
```

---

## Task 4: Replace Image URL input in MessageBuilder with ImageUpload

**Files:**
- Modify: `src/components/MessageBuilder.tsx`

Replace the plain text URL input with the new `ImageUpload` component. The `onChangeCampaign` prop is already available.

- [ ] **Step 1: Add `ImageUpload` import and replace the image section**

In `src/components/MessageBuilder.tsx`, find the import block at the top and add:

```tsx
import { ImageUpload } from './ImageUpload';
```

Then find the entire `{/* Image URL input */}` section (starting from `<div className="flex flex-col gap-1">` with the "Image URL" label and ending at the closing `</div>` of that section, including the thumbnail `<img>` and clear button). Replace the entire section with:

```tsx
      {/* Image upload */}
      <ImageUpload
        imageUrl={campaign.imageUrl}
        onChangeUrl={(url) => onChangeCampaign({ ...campaign, imageUrl: url })}
      />
```

This replaces the entire block: the label, the `<div style={{ position: 'relative' }}>` with the Image icon and input, the clear button, and the thumbnail image preview. All of that is now handled by the `ImageUpload` component.

Remove the `Image` and `X` icons from the Phosphor import since they're no longer used in this file (they're used in `ImageUpload.tsx` instead).

The import line should change from:
```tsx
import { TextB, TextItalic, TextStrikethrough, Code, Image, X } from '@phosphor-icons/react';
```
To:
```tsx
import { TextB, TextItalic, TextStrikethrough, Code } from '@phosphor-icons/react';
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd shalta-app && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MessageBuilder.tsx
git commit -m "feat: replace image URL input with drag-and-drop ImageUpload component"
```

---

## Task 5: Add image thumbnail to BulkSendQueue preview

**Files:**
- Modify: `src/components/BulkSendQueue.tsx`

The BulkSendQueue modal shows a preview of the message before sending. Add the image thumbnail above the message preview if `campaign.imageUrl` is set.

- [ ] **Step 1: Pass `campaign` prop through BulkSendQueue**

In `src/App.tsx`, find the `<BulkSendQueue>` usage and verify `campaign` is already passed. If not, add it.

Currently in App.tsx, the BulkSendQueue usage should look like:
```tsx
<BulkSendQueue
  leads={queueLeads}
  campaign={campaign}
  template={template}
  onMarkSent={markSent}
  onClose={closeBulkQueue}
/>
```

If `campaign` is already there, no change needed. If not, add it.

- [ ] **Step 2: Add image to BulkSendQueue preview**

In `src/components/BulkSendQueue.tsx`, find the WhatsApp-style preview `<div>` (the one with `formatWhatsApp(preview)` via `dangerouslySetInnerHTML`). Right before that `<div>`, add the image thumbnail:

```tsx
{campaign.imageUrl && (
  <div style={{ padding: '0 14px 8px' }}>
    <img
      src={campaign.imageUrl}
      alt="Offer"
      style={{
        width: '100%',
        maxHeight: 120,
        objectFit: 'cover',
        borderRadius: 'var(--radius-sm)',
        display: 'block',
      }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  </div>
)}
```

This should be placed inside the card `<motion.div>`, before the message preview `<div dir="rtl">`. Specifically, it goes after the contact info section and before the message preview section.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd shalta-app && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/BulkSendQueue.tsx
git/App.tsx
git commit -m "feat: show offer image thumbnail in BulkSendQueue preview"
```

---

## Task 6: Update .env.example and deploy config

**Files:**
- Modify: `.env.example`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Update `.env.example`**

Current content:
```
# .env.example — copy to .env.local and fill in values (never commit .env.local)
VITE_APP_PASSWORD=your-secret-password-here
```

Change to:
```
# .env.example — copy to .env.local and fill in values (never commit .env.local)
VITE_APP_PASSWORD=your-secret-password-here
VITE_UPLOAD_FUNCTION_URL=https://xxxxxxxxx.lambda-url.us-east-1.on.aws/
VITE_UPLOAD_API_KEY=your-upload-api-key-here
```

- [ ] **Step 2: Update `.github/workflows/deploy.yml` Build step**

Find the Build step that already has `VITE_APP_PASSWORD`:

```yaml
      - name: Build
        env:
          VITE_APP_PASSWORD: ${{ secrets.VITE_APP_PASSWORD }}
        run: npm run build
```

Change to:

```yaml
      - name: Build
        env:
          VITE_APP_PASSWORD: ${{ secrets.VITE_APP_PASSWORD }}
          VITE_UPLOAD_FUNCTION_URL: ${{ secrets.VITE_UPLOAD_FUNCTION_URL }}
          VITE_UPLOAD_API_KEY: ${{ secrets.VITE_UPLOAD_API_KEY }}
        run: npm run build
```

- [ ] **Step 3: Commit**

```bash
git add .env.example .github/workflows/deploy.yml
git commit -m "chore: add upload env vars to deploy config and example"
```

---

## Task 7: Full build test and copy menu images to public folder

**Files:**
- Copy menu images to `public/menu/`

- [ ] **Step 1: Copy menu images to public folder for easy access**

```bash
mkdir -p public/menu
cp "C:\MYWork\3alaAlshalta\Menu\672683401_1393361626168585_2000368056016809669_n.jpg" public/menu/offer-1.jpg
cp "C:\MYWork\3alaAlshalta\Menu\673946730_1393361579501923_2285088599359561615_n.jpg" public/menu/offer-2.jpg
```

Note: These are placeholder images for development/testing. In production, the upload component will compress and upload user-selected images to S3. But having them in `public/` lets you quickly test by using `/menu/offer-1.jpg` as a URL.

- [ ] **Step 2: Run full build**

```bash
cd shalta-app && npm run build
```

Expected: clean build with no errors.

- [ ] **Step 3: Visual test**

```bash
cd shalta-app && npm run dev
```

Test:
1. Login → side panel → Message Builder
2. See the format toolbar (Bold, Italic, Strikethrough, Monospace)
3. See the emoji row below
4. Click an emoji — inserts at cursor
5. Click Bold with text selected — wraps with `*...*`
6. See the offer image upload area (drop zone)
7. Drop a menu image → shows "Uploading & compressing..." → if Lambda not set up yet, shows error about missing config
8. Type `/menu/offer-1.jpg` in the URL fallback (click the "Or paste an image URL" link) — thumbnail appears
9. WhatsApp preview shows the image + formatted text

- [ ] **Step 4: Commit**

```bash
git add public/menu/
git commit -m "chore: add sample menu images for development testing"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Upload menu image from local files — Task 3 (ImageUpload component)
- ✅ Compress image before upload (max 1200px, JPEG 85%) — Task 2 (uploadImage)
- ✅ Upload to S3 via Lambda — Task 2 (uploadImage) + Task 1 (AWS setup guide)
- ✅ Professional-looking drag-and-drop area — Task 3 (ImageUpload)
- ✅ Image shows in WhatsApp preview — Task 4 (MessageBuilder) + Task 5 (BulkSendQueue)
- ✅ Error handling (file type, size, upload failure) — Task 2 (uploadImage)
- ✅ Loading state during upload — Task 3 (ImageUpload)
- ✅ Clear/remove image button — Task 3 (ImageUpload)
- ✅ Environment variables for Lambda URL and API key — Task 6
- ✅ AWS setup guide for manual Console steps — Task 1
- ✅ Deploy config updated for new env vars — Task 6

**Placeholder scan:** No TBDs, TODOs, or incomplete sections found. All code blocks are complete.

**Type consistency:**
- `uploadImage` returns `Promise<UploadResult | UploadError>` with discriminated union
- `ImageUpload` takes `imageUrl: string` and `onChangeUrl: (url: string) => void`
- `campaign.imageUrl` is `string` — matches `onChangeUrl` type
- Lambda expects `{ image: string, contentType: string, filename: string }` — matches what `uploadImage` sends
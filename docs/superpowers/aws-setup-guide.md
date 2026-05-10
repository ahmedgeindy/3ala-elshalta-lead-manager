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

const s3 = new S3Client({ region: 'us-east-1' });
const BUCKET = 'shalta-menu-images';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;
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

## 6. Add Vite environment variables

In your local `shalta-app/.env.local`, add:

```
VITE_UPLOAD_API_KEY=shalta_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
VITE_UPLOAD_FUNCTION_URL=https://xxxxxxxxx.lambda-url.us-east-1.on.aws/
```

For Amplify Console deployment, add these same variables in:
- **App settings** → **Environment variables**

For GitHub Actions, add them as repository secrets:
```bash
gh secret set VITE_UPLOAD_API_KEY --body "shalta_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
gh secret set VITE_UPLOAD_FUNCTION_URL --body "https://2rnlqck7q2okrsmqqyhfozsmlu0ohnsp.lambda-url.us-east-1.on.aws/"
```
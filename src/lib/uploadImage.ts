const FUNCTION_URL = import.meta.env.VITE_UPLOAD_FUNCTION_URL ?? '';
const API_KEY = import.meta.env.VITE_UPLOAD_API_KEY ?? '';

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.85;
const MAX_DATA_SIZE = 5 * 1024 * 1024;

interface UploadResult {
  url: string;
  error?: undefined;
}

interface UploadError {
  url?: undefined;
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

    const url = new URL(FUNCTION_URL);
    url.searchParams.set('key', API_KEY);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
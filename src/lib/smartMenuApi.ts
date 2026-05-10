import type { SmartMenuPage } from '../types';

const API_URL = import.meta.env.VITE_SMART_MENU_API_URL ?? '';
const API_KEY = import.meta.env.VITE_SMART_MENU_API_KEY ?? '';

type ApiSuccess<T> = { data: T; error?: undefined };
type ApiError = { data?: undefined; error: string };
type ApiResult<T> = ApiSuccess<T> | ApiError;

function authHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'X-API-Key': API_KEY };
}

async function handleResponse<T>(response: Response): Promise<ApiResult<T>> {
  if (!response.ok) {
    if (response.status === 401) {
      return { error: 'Authentication failed. Check your API key.' };
    }
    if (response.status === 404) {
      return { error: 'Page not found.' };
    }
    if (response.status === 409) {
      return { error: 'This slug is already in use. Try a different one.' };
    }
    const text = await response.text().catch(() => '');
    return { error: text || 'An unexpected error occurred.' };
  }

  const data: T = await response.json();
  return { data };
}

function handleError(err: unknown): ApiError {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return { error: 'Network error. Please check your connection.' };
  }
  return { error: err instanceof Error ? err.message : 'An unexpected error occurred.' };
}

export async function createPage(
  page: Omit<SmartMenuPage, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResult<SmartMenuPage>> {
  if (!API_KEY) {
    return { error: 'Smart Menu API is not configured. Set VITE_SMART_MENU_API_KEY.' };
  }

  try {
    const response = await fetch(`${API_URL}/api/smart-menu/pages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(page),
    });
    return handleResponse<SmartMenuPage>(response);
  } catch (err) {
    return handleError(err);
  }
}

export async function updatePage(
  id: string,
  page: Partial<Omit<SmartMenuPage, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResult<SmartMenuPage>> {
  if (!API_KEY) {
    return { error: 'Smart Menu API is not configured. Set VITE_SMART_MENU_API_KEY.' };
  }

  try {
    const response = await fetch(`${API_URL}/api/smart-menu/pages/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(page),
    });
    return handleResponse<SmartMenuPage>(response);
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchPublicPage(slug: string): Promise<ApiResult<SmartMenuPage>> {
  try {
    const response = await fetch(
      `${API_URL}/api/smart-menu/pages/by-slug/${encodeURIComponent(slug)}`
    );
    return handleResponse<SmartMenuPage>(response);
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchPageForEdit(id: string): Promise<ApiResult<SmartMenuPage>> {
  if (!API_KEY) {
    return { error: 'Smart Menu API is not configured. Set VITE_SMART_MENU_API_KEY.' };
  }

  try {
    const response = await fetch(`${API_URL}/api/smart-menu/pages/${encodeURIComponent(id)}`, {
      headers: authHeaders(),
    });
    return handleResponse<SmartMenuPage>(response);
  } catch (err) {
    return handleError(err);
  }
}
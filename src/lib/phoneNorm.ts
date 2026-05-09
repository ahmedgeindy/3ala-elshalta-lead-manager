export function normalizeEgyptianPhone(raw: string): string {
  const cleaned = raw.replace(/\D/g, '');
  if (!cleaned || cleaned === '0' || cleaned.length < 7) return '';

  // Already full E.164 without plus: 201xxxxxxxxx (12 digits)
  if (cleaned.startsWith('20') && cleaned.length >= 12) return '+' + cleaned;

  // Local format: 01xxxxxxxxx (11 digits)
  if (cleaned.startsWith('0') && cleaned.length >= 10) return '+2' + cleaned;

  // Bare 10 digits without leading zero: 1xxxxxxxxx
  if (cleaned.length >= 10) return '+20' + cleaned;

  return '';
}

export function isValidPhone(phone: string): boolean {
  return phone.startsWith('+') && phone.length >= 10;
}

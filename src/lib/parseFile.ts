import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export async function parseFile(file: File): Promise<Record<string, string>[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result.data),
        error: reject,
      });
    });
  }

  if (['xlsx', 'xls', 'ods'].includes(ext)) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
  }

  throw new Error('Unsupported file type. Use CSV or Excel (.xlsx, .xls).');
}

const PHONE_KEYS = [
  'Phone 1 - Value', 'Phone 2 - Value', 'Phone 3 - Value',
  'Phone 1 - Label', 'Phone 2 - Label', 'Phone 3 - Label',
  'Phone', 'Mobile', 'Tel', 'phone', 'mobile', 'هاتف',
];

const NAME_KEYS = [
  'First Name', 'Name', 'Full Name', 'name', 'الاسم', 'Client Name',
];

export function extractPhone(row: Record<string, string>): string {
  for (const key of PHONE_KEYS) {
    const val = row[key]?.trim();
    if (val && val !== '0' && val.length >= 7) return val;
  }
  return '';
}

export function extractName(row: Record<string, string>): string {
  for (const key of NAME_KEYS) {
    const val = row[key]?.trim();
    if (val && val !== '0') return val;
  }
  return Object.values(row).find(v => v?.trim() && v.trim() !== '0') ?? 'Unknown';
}

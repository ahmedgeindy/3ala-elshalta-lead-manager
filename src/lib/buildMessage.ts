import type { Lead, Campaign } from '../types';

export const DEFAULT_TEMPLATE =
  'عشان حضرتك {{name}} من عملاء على الشلته المميزين حبينا نعمل حضرتك خصم {{discount}} على المنيو كلو والعرض سارى لمدة {{duration}} وتقدر تشوف المنيو من هنا {{url}}';

export function buildMessage(template: string, lead: Lead, campaign: Campaign): string {
  let msg = template
    .replace(/\{\{name\}\}/gi, lead.name)
    .replace(/\{\{phone\}\}/gi, lead.phone)
    .replace(/\{\{discount\}\}/gi, campaign.discount)
    .replace(/\{\{duration\}\}/gi, campaign.duration)
    .replace(/\{\{url\}\}/gi, campaign.url)
    .replace(/\{\{(\w+)\}\}/gi, (_, key) => lead.rowData[key] ?? `{{${key}}}`);

  const urls = campaign.imageUrls.filter(u => u.trim() !== '');
  if (urls.length === 1) {
    msg += '\n\n📸 ' + urls[0];
  } else if (urls.length > 1) {
    msg += '\n\n📸 صور العرض:\n' + urls.map((u, i) => `${i + 1}. ${u}`).join('\n');
  }

  return msg;
}

export function buildWaLink(phone: string, message: string): string {
  return `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

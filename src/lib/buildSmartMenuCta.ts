import { buildWaLink } from './buildMessage';

export function buildSmartMenuCtaLink(phone: string, message: string): string {
  return buildWaLink(phone, message);
}
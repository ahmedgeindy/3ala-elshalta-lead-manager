export function formatWhatsApp(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(
    /```([^`]+)```/g,
    '<span style="font-family: var(--font-mono); background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 3px; font-size: 11px;">$1</span>'
  );

  html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');

  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  html = html.replace(/~([^~]+)~/g, '<del>$1</del>');

  html = html.replace(/`([^`]+)`/g,
    '<span style="font-family: var(--font-mono); background: rgba(255,255,255,0.06); padding: 0px 3px; border-radius: 2px; font-size: 11px;">$1</span>'
  );

  html = html.replace(/\n/g, '<br/>');

  return html;
}
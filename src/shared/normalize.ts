const leet: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };

export function normalizeText(text: string): string {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase().split('').map((c) => leet[c] ?? c).join('')
    .replace(/(.)\1{2,}/g, '$1$1').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function compactNormalized(text: string): string { return normalizeText(text).replace(/\s/g, ''); }

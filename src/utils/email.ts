export function parseEmails(emails: string[]): string | string[] {
  const flat = emails.flatMap(e => e.includes(',') ? e.split(',').map(s => s.trim()) : [e.trim()]);
  return flat.length === 1 ? flat[0] : flat;
}

export function isValidEmail(email: string): boolean {
  return /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,})$/.test(email);
}

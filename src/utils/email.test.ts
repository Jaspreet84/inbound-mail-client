import { describe, it, expect } from 'vitest';
import { parseEmails, isValidEmail } from '../utils/email.js';

describe('Email Utilities', () => {
  it('should parse a single email string', () => {
    expect(parseEmails(['test@example.com'])).toBe('test@example.com');
  });

  it('should parse multiple email strings', () => {
    expect(parseEmails(['a@b.com', 'c@d.com'])).toEqual(['a@b.com', 'c@d.com']);
  });

  it('should parse comma-separated emails', () => {
    expect(parseEmails(['a@b.com, c@d.com'])).toEqual(['a@b.com', 'c@d.com']);
  });

  it('should validate emails correctly', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });
});

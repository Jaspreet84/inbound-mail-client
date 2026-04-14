import fs from 'fs';
import path from 'path';

export function loadInboundApiKey(): string {
  const keyPath = path.resolve(process.cwd(), 'api.key');
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, 'utf8').trim();
  }
  return process.env.INBOUND_API_KEY || '';
}

import { Command } from 'commander';
import { InboundAPI } from '../api/inbound.js';
import * as p from '@clack/prompts';

export function registerTestProxy(program: Command, api: InboundAPI) {
  program
    .command('test-proxy')
    .description('Verify proxy filtering by fetching a standard malware test file (EICAR)')
    .action(async () => {
      const s = p.spinner();
      s.start('Attempting to fetch EICAR test file...');
      try {
        await api.testProxy();
        s.stop('Download completed (Wait, it should have been blocked!)');
        p.log.warn('The proxy did NOT block the EICAR test file. Your security filters may be inactive.');
      } catch (err: any) {
        s.stop('Download failed');
        p.log.success('Proxy successfully blocked the EICAR test file (Expected behavior).');
        p.log.info(`Reason: ${err.message}`);
      }
    });
}

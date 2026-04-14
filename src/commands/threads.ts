import { Command } from 'commander';
import { InboundAPI } from '../api/inbound.js';
import * as p from '@clack/prompts';

export function registerThreads(program: Command, api: InboundAPI) {
  program
    .command('threads')
    .description('List email threads')
    .option('-a, --address <email>', 'Filter by email address')
    .option('-s, --search <query>', 'Search query')
    .option('-u, --unread', 'Filter by unread status')
    .action(async (options) => {
      try {
        const response = await api.listThreads({
          address: options.address,
          search: options.search,
          unread: options.unread,
        });
        p.note(JSON.stringify(response, null, 2), 'Threads');
      } catch (err: any) {
        p.log.error(err.message);
        process.exit(1);
      }
    });
}

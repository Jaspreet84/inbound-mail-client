import { Command } from 'commander';
import { InboundAPI } from '../api/inbound.js';
import * as p from '@clack/prompts';

export function registerList(program: Command, api: InboundAPI) {
  program
    .command('list')
    .description('List emails')
    .option('-a, --address <email>', 'Filter by email address')
    .option('-t, --type <type>', 'Filter by type (all, sent, received, scheduled)', 'all')
    .option('-s, --search <query>', 'Search query')
    .option('-l, --limit <number>', 'Limit results', '50')
    .action(async (options) => {
      try {
        const response = await api.listEmails({
          address: options.address,
          type: options.type,
          search: options.search,
          limit: parseInt(options.limit),
        });
        p.note(JSON.stringify(response, null, 2), 'Emails');
      } catch (err: any) {
        p.log.error(err.message);
        process.exit(1);
      }
    });
}

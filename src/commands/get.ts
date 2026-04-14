import { Command } from 'commander';
import { InboundAPI } from '../api/inbound.js';
import * as p from '@clack/prompts';

export function registerGet(program: Command, api: InboundAPI) {
  program
    .command('get')
    .description('Get a single email by ID')
    .argument('<id>', 'Email ID')
    .action(async (id) => {
      try {
        const response = await api.getEmail(id);
        p.note(JSON.stringify(response, null, 2), 'Email Details');
      } catch (err: any) {
        p.log.error(err.message);
        process.exit(1);
      }
    });
}

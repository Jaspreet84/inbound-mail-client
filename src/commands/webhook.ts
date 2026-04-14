import { Command } from 'commander';
import { InboundAPI } from '../api/inbound.js';
import * as p from '@clack/prompts';

export function registerWebhook(program: Command, api: InboundAPI) {
  program
    .command('webhook')
    .description('Create a webhook endpoint')
    .requiredOption('-n, --name <name>', 'Endpoint name')
    .requiredOption('-u, --url <url>', 'Webhook URL')
    .option('--description <description>', 'Description for this endpoint')
    .action(async (options) => {
      try {
        const response = await api.createEndpoint({
          name: options.name,
          type: 'webhook',
          config: {
            url: options.url,
          },
          description: options.description,
        });
        p.note(JSON.stringify(response, null, 2), 'Webhook Endpoint Created');
      } catch (err: any) {
        p.log.error(err.message);
        process.exit(1);
      }
    });
}

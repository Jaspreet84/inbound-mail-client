import { Command } from 'commander';
import { InboundAPI } from '../api/inbound.js';
import { WebhookSiteAPI } from '../api/webhook-site.js';
import * as p from '@clack/prompts';

export function registerListen(program: Command, api: InboundAPI, whApi: WebhookSiteAPI) {
  program
    .command('listen')
    .description('Create or use an existing webhook.site URL, register it (if new), and poll for new emails')
    .argument('[address...]', 'Email address to automatically route to this webhook (handles spaces)')
    .option('-i, --interval <seconds>', 'Polling interval in seconds', '10')
    .option('-n, --name <name>', 'Name for the webhook endpoint', 'CLI Listener')
    .option('-t, --token <id>', 'Existing webhook.site token ID to listen to')
    .option('-a, --address <email>', 'Optional email address (alternative to positional argument)')
    .option('--description <description>', 'Description for this endpoint')
    .action(async (addressArgs, options) => {
      try {
        const intervalMs = parseInt(options.interval) * 1000;
        let tokenId = options.token;
        let webhookUrl = '';
        let endpointId = '';
        
        // Combine positional arguments if provided (e.g. "jaspreet @velor.pro" -> "jaspreet@velor.pro")
        const positionalAddress = addressArgs && addressArgs.length > 0 ? addressArgs.join('') : null;
        const targetAddress = positionalAddress || options.address;

        let addressId: string | null = null;
        let originalRouting: { endpointId?: string | null; webhookId?: string | null } = {};
        let isExistingEndpoint = false;

        if (targetAddress) {
          p.log.info(`Finding ID for address: ${targetAddress}...`);
          const addressesResponse = await api.listEmailAddresses();
          const addressObj = addressesResponse.data.find((a: any) => a.address === targetAddress);
          if (!addressObj) {
            throw new Error(`Address not found: ${targetAddress}`);
          }
          addressId = addressObj.id;
          originalRouting = {
            endpointId: addressObj.routing?.id && addressObj.routing?.type === 'endpoint' ? addressObj.routing.id : null,
            webhookId: addressObj.routing?.id && addressObj.routing?.type === 'webhook' ? addressObj.routing.id : null,
          };

          if (addressObj.routing?.id && addressObj.routing?.type === 'endpoint') {
            p.log.info(`Found existing routing for this address, checking endpoint details...`);
            try {
              const endpoint = await api.getEndpoint(addressObj.routing.id);
              if (endpoint.type === 'webhook' && endpoint.config?.url?.includes('webhook.site/')) {
                const match = endpoint.config.url.match(/webhook\.site\/([a-z0-9-]+)/i);
                if (match) {
                  tokenId = match[1];
                  webhookUrl = endpoint.config.url;
                  isExistingEndpoint = true;
                  p.log.success(`Found existing webhook.site endpoint for this address: ${webhookUrl}. Listening...`);
                }
              }
            } catch (e: any) {
              p.log.warn(`Could not fetch details for existing endpoint ${addressObj.routing.id}: ${e.message}. Proceeding to create new endpoint.`);
            }
          }
        }

        if (!tokenId) {
          p.log.info('Creating webhook.site token...');
          const tokenData = await whApi.createToken();
          tokenId = tokenData.uuid;
          webhookUrl = `https://webhook.site/${tokenId}`;
          p.log.success(`Webhook URL created: ${webhookUrl}`);

          p.log.info(`Registering webhook with Inbound...`);
          const endpointResponse = await api.createEndpoint({
            name: options.name,
            type: 'webhook',
            config: { url: webhookUrl },
            description: options.description,
          });
          endpointId = endpointResponse.id;
          p.log.success('Webhook registered with Inbound.');
        } else if (!webhookUrl) {
          p.log.info(`Using existing webhook.site token: ${tokenId}`);
          webhookUrl = `https://webhook.site/${tokenId}`;
        }

        if (addressId && endpointId && !isExistingEndpoint) {
          p.log.info(`Updating routing for ${targetAddress} to point to new webhook...`);
          await api.updateEmailAddress(addressId, { endpointId, webhookId: null });
          p.log.success(`Routing updated successfully.`);
        }
        
        p.log.info(`Listening for emails (polling every ${options.interval}s). Press Ctrl+C to stop.\n`);

        const restoreRouting = async () => {
          if (!isExistingEndpoint && addressId && (originalRouting.endpointId !== undefined || originalRouting.webhookId !== undefined)) {
            p.log.info(`\nRestoring original routing for ${targetAddress}...`);
            try {
              await api.updateEmailAddress(addressId, originalRouting);
              p.log.success('Original routing restored.');
            } catch (e: any) {
              p.log.error(`Failed to restore routing: ${e.message}`);
            }
          }
          process.exit(0);
        };

        process.on('SIGINT', restoreRouting);
        process.on('SIGTERM', restoreRouting);

        let lastSeenId: string | null = null;

        const poll = async () => {
          try {
            const result = await whApi.getRequests(tokenId!);
            const requests = result.data || [];
            
            if (requests.length > 0) {
              const newRequests = [];
              for (const req of requests) {
                if (req.uuid === lastSeenId) break;
                newRequests.push(req);
              }
              
              if (newRequests.length > 0) {
                lastSeenId = requests[0].uuid;
                for (const req of newRequests.reverse()) {
                  try {
                    const payload = JSON.parse(req.content);
                    p.note(JSON.stringify(payload, null, 2), `New Email Received: ${payload.subject || 'No Subject'}`);
                  } catch (e) {
                    p.log.warn('Received request body that was not valid JSON.');
                    p.log.info(req.content);
                  }
                }
              }
            }
          } catch (err: any) {
            p.log.error(`Polling error: ${err.message}`);
          }
        };

        setInterval(poll, intervalMs);
        await poll(); // Initial poll
        
        await new Promise(() => {});

      } catch (err: any) {
        p.log.error(err.message);
        process.exit(1);
      }
    });
}

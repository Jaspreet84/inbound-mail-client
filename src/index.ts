#!/usr/bin/env node
import { Command } from 'commander';
import { InboundAPI, WebhookSiteAPI } from './api.js';
import * as p from '@clack/prompts';
import fs from 'fs';
import path from 'path';

const program = new Command();
const api = new InboundAPI();
const whApi = new WebhookSiteAPI();

program
  .name('inbound')
  .description('AI-first tool for sending and receiving emails')
  .version('1.0.0');

program
  .command('send')
  .description('Send an email')
  .requiredOption('-t, --to <email...>', 'Recipient email address(es)')
  .requiredOption('-f, --from <email>', 'Sender email address')
  .requiredOption('-s, --subject <subject>', 'Email subject')
  .option('--cc <email...>', 'CC recipient(s)')
  .option('--bcc <email...>', 'BCC recipient(s)')
  .option('--reply-to <email...>', 'Reply-to address(es)')
  .option('--text <text>', 'Plain text content')
  .option('--html <html>', 'HTML content')
  .option('-a, --attachment <path...>', 'Path to attachment(s)')
  .action(async (options) => {
    try {
      const attachments = options.attachment?.map((filePath: string) => {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found: ${filePath}`);
        }
        return {
          filename: path.basename(fullPath),
          content: fs.readFileSync(fullPath).toString('base64'),
        };
      });

      const parseEmails = (emails: string[]) => {
        const flat = emails.flatMap(e => e.includes(',') ? e.split(',').map(s => s.trim()) : [e.trim()]);
        return flat.length === 1 ? flat[0] : flat;
      };

      const response = await api.sendEmail({
        to: parseEmails(options.to),
        from: options.from,
        subject: options.subject,
        cc: options.cc ? parseEmails(options.cc) : undefined,
        bcc: options.bcc ? parseEmails(options.bcc) : undefined,
        reply_to: options.replyTo ? parseEmails(options.replyTo) : undefined,
        text: options.text,
        html: options.html,
        attachments,
      });

      p.note(JSON.stringify(response, null, 2), 'Email Sent Successfully');
    } catch (err: any) {
      p.log.error(err.message);
      process.exit(1);
    }
  });

program
  .command('reply')
  .description('Reply to an email')
  .argument('<id>', 'ID of the email to reply to')
  .requiredOption('-f, --from <email>', 'Sender email address')
  .option('--text <text>', 'Plain text content')
  .option('--html <html>', 'HTML content')
  .option('-a, --attachment <path...>', 'Path to attachment(s)')
  .action(async (id, options) => {
    try {
      const attachments = options.attachment?.map((filePath: string) => {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found: ${filePath}`);
        }
        return {
          filename: path.basename(fullPath),
          content: fs.readFileSync(fullPath).toString('base64'),
        };
      });

      const response = await api.replyToEmail(id, {
        from: options.from,
        text: options.text,
        html: options.html,
        attachments,
      });

      p.note(JSON.stringify(response, null, 2), 'Reply Sent Successfully');
    } catch (err: any) {
      p.log.error(err.message);
      process.exit(1);
    }
  });

program
  .command('download')
  .description('Download an attachment')
  .argument('<id>', 'Attachment ID')
  .argument('<filename>', 'Filename')
  .option('-o, --output <path>', 'Output directory', '.')
  .action(async (id, filename, options) => {
    try {
      const data = await api.downloadAttachment(id, filename);
      const outputPath = path.join(options.output, filename);
      fs.writeFileSync(outputPath, Buffer.from(data));
      p.log.success(`Attachment downloaded to ${outputPath}`);
    } catch (err: any) {
      p.log.error(err.message);
      process.exit(1);
    }
  });

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

program
  .command('listen')
  .description('Create or use an existing webhook.site URL, register it (if new), and poll for new emails')
  .option('-i, --interval <seconds>', 'Polling interval in seconds', '10')
  .option('-n, --name <name>', 'Name for the webhook endpoint', 'CLI Listener')
  .option('-t, --token <id>', 'Existing webhook.site token ID to listen to')
  .option('-a, --address <email>', 'Optional email address to automatically route to this webhook')
  .option('--description <description>', 'Description for this endpoint')
  .action(async (options) => {
    try {
      const intervalMs = parseInt(options.interval) * 1000;
      let tokenId = options.token;
      let webhookUrl = '';
      let endpointId = '';
      let addressId: string | null = null;
      let originalRouting: { endpointId?: string | null; webhookId?: string | null } = {};

      if (options.address) {
        p.log.info(`Finding ID for address: ${options.address}...`);
        const addressesResponse = await api.listEmailAddresses();
        const addressObj = addressesResponse.data.find((a: any) => a.address === options.address);
        if (!addressObj) {
          throw new Error(`Address not found: ${options.address}`);
        }
        addressId = addressObj.id;
        originalRouting = {
          endpointId: addressObj.routing?.id && addressObj.routing?.type === 'endpoint' ? addressObj.routing.id : null,
          webhookId: addressObj.routing?.id && addressObj.routing?.type === 'webhook' ? addressObj.routing.id : null,
        };
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
      } else {
        p.log.info(`Using existing webhook.site token: ${tokenId}`);
        webhookUrl = `https://webhook.site/${tokenId}`;
      }

      if (addressId && endpointId) {
        p.log.info(`Updating routing for ${options.address} to point to new webhook...`);
        await api.updateEmailAddress(addressId, { endpointId, webhookId: null });
        p.log.success(`Routing updated successfully.`);
      }
      
      p.log.info(`Listening for emails (polling every ${options.interval}s). Press Ctrl+C to stop.\n`);

      const restoreRouting = async () => {
        if (addressId && (originalRouting.endpointId !== undefined || originalRouting.webhookId !== undefined)) {
          p.log.info(`\nRestoring original routing for ${options.address}...`);
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
          const result = await whApi.getRequests(tokenId);
          const requests = result.data || [];
          
          if (requests.length > 0) {
            const newRequests = [];
            for (const req of requests) {
              if (req.uuid === lastSeenId) break;
              newRequests.push(req);
            }
            
            if (newRequests.length > 0) {
              lastSeenId = requests[0].uuid;
              // Reverse to show oldest new request first
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
      
      // Keep process alive
      await new Promise(() => {});

    } catch (err: any) {
      p.log.error(err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

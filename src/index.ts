#!/usr/bin/env node
import { Command } from 'commander';
import { InboundAPI } from './api.js';
import * as p from '@clack/prompts';
import fs from 'fs';
import path from 'path';

const program = new Command();
const api = new InboundAPI();

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
  .requiredOption('-u, --url <url>', 'Webhook URL')
  .option('--filter <filter>', 'Filter rule for this endpoint')
  .action(async (options) => {
    try {
      const response = await api.createEndpoint({
        type: 'webhook',
        config: {
          url: options.url,
        },
        filter: options.filter,
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

program.parse(process.argv);

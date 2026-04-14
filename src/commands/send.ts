import { Command } from 'commander';
import { InboundAPI } from '../api/inbound.js';
import { parseEmails } from '../utils/email.js';
import * as p from '@clack/prompts';
import fs from 'fs';
import path from 'path';

export function registerSend(program: Command, api: InboundAPI) {
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
}

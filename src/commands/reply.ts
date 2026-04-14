import { Command } from 'commander';
import { InboundAPI } from '../api/inbound.js';
import * as p from '@clack/prompts';
import fs from 'fs';
import path from 'path';

export function registerReply(program: Command, api: InboundAPI) {
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
}

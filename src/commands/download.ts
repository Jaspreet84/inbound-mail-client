import { Command } from 'commander';
import { InboundAPI } from '../api/inbound.js';
import * as p from '@clack/prompts';
import fs from 'fs';
import path from 'path';

export function registerDownload(program: Command, api: InboundAPI) {
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
}

#!/usr/bin/env node
import { Command } from 'commander';
import { InboundAPI } from './api/inbound.js';
import { WebhookSiteAPI } from './api/webhook-site.js';
import { setVerbose, setUseProxy, setSecure } from './api/client.js';

// Import command registers
import { registerSend } from './commands/send.js';
import { registerReply } from './commands/reply.js';
import { registerDownload } from './commands/download.js';
import { registerWebhook } from './commands/webhook.js';
import { registerList } from './commands/list.js';
import { registerThreads } from './commands/threads.js';
import { registerGet } from './commands/get.js';
import { registerListen } from './commands/listen.js';
import { registerTestProxy } from './commands/test-proxy.js';

const program = new Command();
const api = new InboundAPI();
const whApi = new WebhookSiteAPI();

program
  .name('inbound')
  .description('AI-first tool for sending and receiving emails')
  .version('1.0.0')
  .option('-v, --verbose', 'Verbose output (for debugging API calls)')
  .option('--secure', 'Enable TLS certificate validation (disabled by default)')
  .option('--no-proxy', 'Disable using system proxy environment variables')
  .on('option:verbose', () => {
    setVerbose(true);
  })
  .on('option:secure', () => {
    setSecure(true);
  })
  .on('option:no-proxy', () => {
    setUseProxy(false);
  });

// Register all commands
registerSend(program, api);
registerReply(program, api);
registerDownload(program, api);
registerWebhook(program, api);
registerList(program, api);
registerThreads(program, api);
registerGet(program, api);
registerListen(program, api, whApi);
registerTestProxy(program, api);

program.parse(process.argv);

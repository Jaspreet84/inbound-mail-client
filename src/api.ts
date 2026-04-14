import axios, { AxiosProxyConfig } from 'axios';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const API_BASE_URL = 'https://inbound.new/api/e2/';

let isVerbose = process.env.VERBOSE === 'true';
export function setVerbose(v: boolean) {
  isVerbose = v;
}

let useProxy = process.env.NO_PROXY !== 'true';
export function setUseProxy(v: boolean) {
  useProxy = v;
}

function getProxyConfig(): AxiosProxyConfig | false {
  if (!useProxy) return false;
  const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
  if (!proxyUrl) return false;

  try {
    const parsed = new URL(proxyUrl);
    return {
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80),
      auth: parsed.username ? {
        username: parsed.username,
        password: parsed.password
      } : undefined
    };
  } catch (e) {
    return false;
  }
}

const axiosInstance = axios.create({
  maxRedirects: 0, // Disable auto-follow to catch loops
  headers: {
    'User-Agent': 'Mozilla/5.0 (Node.js)'
  }
});

// Update instance config dynamically
axiosInstance.interceptors.request.use(config => {
  config.proxy = getProxyConfig();
  if (isVerbose) {
    console.log(`\x1b[36m[DEBUG] Request: ${config.method?.toUpperCase()} ${config.url}\x1b[0m`);
    if (config.proxy) {
      console.log(`\x1b[36m[DEBUG] Using Proxy: ${config.proxy.host}:${config.proxy.port}\x1b[0m`);
    }
    if (config.headers.Authorization) {
      const auth = config.headers.Authorization.toString();
      console.log(`\x1b[36m[DEBUG] Auth Header: ${auth.substring(0, 20)}...\x1b[0m`);
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  response => {
    if (isVerbose) {
      console.log(`\x1b[32m[DEBUG] Response: ${response.status} ${response.config.url}\x1b[0m`);
    }
    return response;
  },
  error => {
    if (isVerbose) {
      if (error.response) {
        console.log(`\x1b[31m[DEBUG] Error Response: ${error.response.status} ${error.config.url}\x1b[0m`);
        if (error.response.headers.location) {
          console.log(`\x1b[33m[DEBUG] Redirect Location: ${error.response.headers.location}\x1b[0m`);
        }
        console.log(`\x1b[31m[DEBUG] Data: ${JSON.stringify(error.response.data)}\x1b[0m`);
        console.log(`\x1b[31m[DEBUG] Headers: ${JSON.stringify(error.response.headers)}\x1b[0m`);
      } else if (error.request) {
        console.log(`\x1b[31m[DEBUG] No Response from: ${error.config.url}\x1b[0m`);
        console.log(`\x1b[31m[DEBUG] Error: ${error.message}\x1b[0m`);
      }
    }
    return Promise.reject(error);
  }
);

export class InboundAPI {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || this.loadApiKey();
    if (!this.apiKey) {
      throw new Error('API key not found. Please provide one or ensure api.key exists.');
    }
  }

  private loadApiKey(): string {
    const keyPath = path.resolve(process.cwd(), 'api.key');
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8').trim();
    }
    return process.env.INBOUND_API_KEY || '';
  }

  async sendEmail(data: {
    to: string | string[];
    from: string;
    subject: string;
    cc?: string | string[];
    bcc?: string | string[];
    reply_to?: string | string[];
    text?: string;
    html?: string;
    attachments?: Array<{ filename: string; content: string; content_type?: string; path?: string }>;
    scheduled_at?: string;
    tags?: Array<{ name: string; value: string }>;
  }) {
    const response = await axiosInstance.post(`${API_BASE_URL}emails`, data, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async replyToEmail(id: string, data: {
    from: string;
    to?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    attachments?: Array<{ filename: string; content: string; content_type?: string; path?: string }>;
    reply_all?: boolean;
    tags?: Array<{ name: string; value: string }>;
  }) {
    const response = await axiosInstance.post(`${API_BASE_URL}emails/${id}/reply`, data, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async downloadAttachment(id: string, filename: string) {
    const response = await axiosInstance.get(`${API_BASE_URL}attachments/${id}/${filename}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      responseType: 'arraybuffer',
    });
    return response.data;
  }

  async createEndpoint(data: { 
    name: string;
    type: 'webhook';
    config: {
      url: string;
      timeout?: number;
      retryAttempts?: number;
      headers?: Record<string, string>;
    };
    description?: string;
  }) {
    const response = await axiosInstance.post(`${API_BASE_URL}endpoints`, data, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async listEmails(params?: {
    type?: 'all' | 'sent' | 'received' | 'scheduled';
    status?: string;
    time_range?: string;
    search?: string;
    address?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await axiosInstance.get(`${API_BASE_URL}emails`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      params,
    });
    return response.data;
  }

  async listThreads(params?: {
    address?: string;
    limit?: number;
    cursor?: string;
    search?: string;
    unread?: boolean;
  }) {
    const response = await axiosInstance.get(`${API_BASE_URL}mail/threads`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      params,
    });
    return response.data;
  }

  async getEmail(id: string) {
    const response = await axiosInstance.get(`${API_BASE_URL}emails/${id}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async listEmailAddresses() {
    const response = await axiosInstance.get(`${API_BASE_URL}email-addresses`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async updateEmailAddress(id: string, data: { endpointId?: string | null; webhookId?: string | null; isActive?: boolean }) {
    const response = await axiosInstance.put(`${API_BASE_URL}email-addresses/${id}`, data, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async getEndpoint(id: string) {
    const response = await axiosInstance.get(`${API_BASE_URL}endpoints/${id}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async testProxy() {
    const url = 'https://secure.eicar.org/eicar.com';
    const response = await axiosInstance.get(url);
    return response.data;
  }
}

export class WebhookSiteAPI {
  private baseUrl = 'https://webhook.site';

  async createToken() {
    const response = await axiosInstance.post(`${this.baseUrl}/token`);
    return response.data; // { uuid: '...', ... }
  }

  async getRequests(tokenId: string) {
    const response = await axiosInstance.get(`${this.baseUrl}/token/${tokenId}/requests`, {
      params: { sorting: 'newest' }
    });
    return response.data; // { data: [...], ... }
  }
}

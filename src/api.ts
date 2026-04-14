import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'https://api.inbound.new/v2';

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
    const response = await axios.post(`${API_BASE_URL}/emails`, data, {
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
    const response = await axios.post(`${API_BASE_URL}/emails/${id}/reply`, data, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async downloadAttachment(id: string, filename: string) {
    const response = await axios.get(`${API_BASE_URL}/attachments/${id}/${filename}`, {
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
    const response = await axios.post(`${API_BASE_URL}/endpoints`, data, {
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
    const response = await axios.get(`${API_BASE_URL}/emails`, {
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
    const response = await axios.get(`${API_BASE_URL}/mail/threads`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      params,
    });
    return response.data;
  }

  async getEmail(id: string) {
    const response = await axios.get(`${API_BASE_URL}/emails/${id}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async listEmailAddresses() {
    const response = await axios.get(`${API_BASE_URL}/email-addresses`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async updateEmailAddress(id: string, data: { endpointId?: string | null; webhookId?: string | null; isActive?: boolean }) {
    const response = await axios.put(`${API_BASE_URL}/email-addresses/${id}`, data, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async getEndpoint(id: string) {
    const response = await axios.get(`${API_BASE_URL}/endpoints/${id}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }
}

export class WebhookSiteAPI {
  private baseUrl = 'https://webhook.site';

  async createToken() {
    const response = await axios.post(`${this.baseUrl}/token`);
    return response.data; // { uuid: '...', ... }
  }

  async getRequests(tokenId: string) {
    const response = await axios.get(`${this.baseUrl}/token/${tokenId}/requests`, {
      params: { sorting: 'newest' }
    });
    return response.data; // { data: [...], ... }
  }
}

import { AxiosInstance } from 'axios';
import { createClient } from './client.js';
import { loadInboundApiKey } from '../utils/config.js';
import { 
  SendEmailRequest, 
  ReplyEmailRequest, 
  CreateEndpointRequest, 
  ListEmailsParams, 
  ListThreadsParams 
} from './types.js';

const INBOUND_BASE_URL = 'https://inbound.new/api/e2/';

export class InboundAPI {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || loadInboundApiKey();
    if (!this.apiKey) {
      throw new Error('Inbound API key not found. Please provide one or ensure api.key exists.');
    }
    this.client = createClient(INBOUND_BASE_URL);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.apiKey}`;
  }

  async sendEmail(data: SendEmailRequest) {
    const response = await this.client.post('emails', data);
    return response.data;
  }

  async replyToEmail(id: string, data: ReplyEmailRequest) {
    const response = await this.client.post(`emails/${id}/reply`, data);
    return response.data;
  }

  async downloadAttachment(id: string, filename: string) {
    const response = await this.client.get(`attachments/${id}/${filename}`, {
      responseType: 'arraybuffer',
    });
    return response.data;
  }

  async createEndpoint(data: CreateEndpointRequest) {
    const response = await this.client.post('endpoints', data);
    return response.data;
  }

  async listEmails(params?: ListEmailsParams) {
    const response = await this.client.get('emails', { params });
    return response.data;
  }

  async listThreads(params?: ListThreadsParams) {
    const response = await this.client.get('mail/threads', { params });
    return response.data;
  }

  async getEmail(id: string) {
    const response = await this.client.get(`emails/${id}`);
    return response.data;
  }

  async listEmailAddresses() {
    const response = await this.client.get('email-addresses');
    return response.data;
  }

  async updateEmailAddress(id: string, data: { endpointId?: string | null; webhookId?: string | null; isActive?: boolean }) {
    const response = await this.client.put(`email-addresses/${id}`, data);
    return response.data;
  }

  async getEndpoint(id: string) {
    const response = await this.client.get(`endpoints/${id}`);
    return response.data;
  }

  async testProxy() {
    // Standard axios get to verify proxy/filtering
    const response = await this.client.get('https://secure.eicar.org/eicar.com');
    return response.data;
  }
}

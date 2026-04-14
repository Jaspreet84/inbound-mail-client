import { AxiosInstance } from 'axios';
import { createClient } from './client.js';

const WEBHOOK_SITE_BASE_URL = 'https://webhook.site/';

export class WebhookSiteAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = createClient(WEBHOOK_SITE_BASE_URL);
  }

  async createToken() {
    const response = await this.client.post('token');
    return response.data;
  }

  async getRequests(tokenId: string) {
    const response = await this.client.get(`token/${tokenId}/requests`, {
      params: { sorting: 'newest' }
    });
    return response.data;
  }
}

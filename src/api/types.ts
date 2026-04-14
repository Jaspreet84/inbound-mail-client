export interface Attachment {
  filename: string;
  content: string;
  content_type?: string;
  path?: string;
}

export interface Tag {
  name: string;
  value: string;
}

export interface SendEmailRequest {
  to: string | string[];
  from: string;
  subject: string;
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string | string[];
  text?: string;
  html?: string;
  attachments?: Attachment[];
  scheduled_at?: string;
  tags?: Tag[];
}

export interface ReplyEmailRequest {
  from: string;
  to?: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
  reply_all?: boolean;
  tags?: Tag[];
}

export interface EndpointConfigRequest {
  url: string;
  timeout?: number;
  retryAttempts?: number;
  headers?: Record<string, string>;
}

export interface CreateEndpointRequest {
  name: string;
  type: 'webhook';
  config: EndpointConfigRequest;
  description?: string;
}

export interface ListEmailsParams {
  type?: 'all' | 'sent' | 'received' | 'scheduled';
  status?: string;
  time_range?: string;
  search?: string;
  address?: string;
  limit?: number;
  offset?: number;
}

export interface ListThreadsParams {
  address?: string;
  limit?: number;
  cursor?: string;
  search?: string;
  unread?: boolean;
}

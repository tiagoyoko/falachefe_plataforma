// UAZ API Types - Baseado na documentação OpenAPI
export interface UAZInstance {
  id: string;
  token: string;
  status: 'disconnected' | 'connecting' | 'connected';
  paircode?: string;
  qrcode?: string;
  name: string;
  profileName?: string;
  profilePicUrl?: string;
  isBusiness: boolean;
  platform?: string;
  systemName?: string;
  owner?: string;
  lastDisconnect?: string;
  created?: string;
  updated?: string;
}

export interface UAZWebhook {
  id: string;
  instance_id: string;
  enabled: boolean;
  url: string;
  events: string[];
  excludeMessages: string[];
  addUrlEvents: boolean;
  addUrlTypesMessages: boolean;
  created: string;
  updated: string;
}

export interface SendTextMessageRequest {
  number: string;
  text: string;
  delay?: number;
  readchat?: boolean;
  readmessages?: boolean;
  replyid?: string;
  mentions?: string[];
  forward?: boolean;
  track_source?: string;
  track_id?: string;
  placeholders?: Record<string, string>;
}

export interface SendMediaMessageRequest {
  number: string;
  media: string; // URL or base64
  type: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  filename?: string;
  delay?: number;
  readchat?: boolean;
  readmessages?: boolean;
  replyid?: string;
  forward?: boolean;
  track_source?: string;
  track_id?: string;
  placeholders?: Record<string, string>;
}

export interface MessageResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    status: string;
    timestamp: number;
  };
  error?: string;
}

export interface WebhookPayload {
  event: string;
  instance: string;
  data: {
    id: string;
    timestamp: number;
    status?: string;
    from?: string;
    to?: string;
    body?: string;
    type?: string;
    caption?: string;
    filename?: string;
    mimetype?: string;
    url?: string;
    isGroup?: boolean;
    isGroupNo?: boolean;
    wasSentByApi?: boolean;
    chatId?: string;
    sender?: {
      id: string;
      name: string;
      profilePicUrl?: string;
    };
    chat?: {
      id: string;
      name: string;
      isGroup: boolean;
    };
  };
}

export interface CreateTemplateRequest {
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  content: {
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      media?: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    buttons?: Array<{
      type: 'url' | 'phone_number' | 'quick_reply';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  };
}

export interface TemplateResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paused';
    category: string;
    language: string;
    created: string;
    updated: string;
  };
  error?: string;
}

export interface UAZError {
  success: false;
  error: string;
  code?: number;
  details?: any;
}

export interface UAZConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  webhookSecret?: string;
  timeout?: number;
  retries?: number;
}

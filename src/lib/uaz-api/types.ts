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

// Estrutura real do payload UAZAPI
export interface UAZWebhookPayload {
  BaseUrl: string;
  EventType: string;
  chat: UAZChat;
  message: UAZMessage;
  owner: string;
  token: string;
}

export interface UAZChat {
  chatbot_agentResetMemoryAt: number;
  chatbot_disableUntil: number;
  chatbot_lastTriggerAt: number;
  chatbot_lastTrigger_id: string;
  id: string;
  image: string;
  imagePreview: string;
  lead_assignedAttendant_id: string;
  lead_email: string;
  lead_field01: string;
  lead_field02: string;
  lead_field03: string;
  lead_field04: string;
  lead_field05: string;
  lead_field06: string;
  lead_field07: string;
  lead_field08: string;
  lead_field09: string;
  lead_field10: string;
  lead_field11: string;
  lead_field12: string;
  lead_field13: string;
  lead_field14: string;
  lead_field15: string;
  lead_field16: string;
  lead_field17: string;
  lead_field18: string;
  lead_field19: string;
  lead_field20: string;
  lead_fullName: string;
  lead_isTicketOpen: boolean;
  lead_kanbanOrder: number;
  lead_name: string;
  lead_notes: string;
  lead_personalid: string;
  lead_status: string;
  lead_tags: string[];
  name: string;
  owner: string;
  phone: string;
  wa_archived: boolean;
  wa_chatid: string;
  wa_contactName: string;
  wa_ephemeralExpiration: number;
  wa_fastid: string;
  wa_isBlocked: boolean;
  wa_isGroup: boolean;
  wa_isGroup_admin: boolean;
  wa_isGroup_announce: boolean;
  wa_isGroup_community: boolean;
  wa_isGroup_member: boolean;
  wa_isPinned: boolean;
  wa_label: string[];
  wa_lastMessageSender: string;
  wa_lastMessageTextVote: string;
  wa_lastMessageType: string;
  wa_lastMsgTimestamp: number;
  wa_muteEndTime: number;
  wa_name: string;
  wa_unreadCount: number;
}

export interface UAZMessage {
  buttonOrListid: string;
  chatid: string;
  content: string;
  convertOptions: string;
  edited: string;
  fromMe: boolean;
  groupName: string;
  id: string;
  isGroup: boolean;
  mediaType: string;
  messageTimestamp: number;
  messageType: string;
  messageid: string;
  owner: string;
  quoted: string;
  reaction: string;
  sender: string;
  senderName: string;
  sender_lid: string;
  sender_pn: string;
  source: string;
  status: string;
  text: string;
  track_id: string;
  track_source: string;
  type: string;
  vote: string;
  wasSentByApi: boolean;
}

// Estrutura legada para compatibilidade
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

// Re-export all types from schema files
export type {
  Company,
  NewCompany,
  User,
  NewUser,
  Agent,
  NewAgent,
  Conversation,
  NewConversation,
  Message,
  NewMessage,
  Template,
  NewTemplate,
  UserOnboarding,
  NewUserOnboarding,
} from '../lib/schema';

export type {
  AgentMemory,
  NewAgentMemory,
  SharedMemory,
  NewSharedMemory,
  ConversationContext,
  NewConversationContext,
  AgentLearning,
  NewAgentLearning,
} from '../lib/memory-schema';

export type {
  AdminUser,
  NewAdminUser,
  AuditLog,
  NewAuditLog,
} from '../lib/auth/auth-schema';

export type {
  SubscriptionPlan,
  NewSubscriptionPlan,
  UserSubscription,
  NewUserSubscription,
  Payment,
  NewPayment,
  Invoice,
  NewInvoice,
  UsageLimit,
  NewUsageLimit,
  UsageHistory,
  NewUsageHistory,
  StripeWebhook,
  NewStripeWebhook,
} from '../lib/billing-schema';

// Additional types for the platform
export interface UAZMessage {
  id: string;
  from: string;
  to: string;
  type: 'text' | 'image' | 'document' | 'template' | 'interactive' | 'flow';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface UAZTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paused';
  content: {
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      media?: string;
    };
    body: {
      text: string;
      variables?: string[];
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
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCapabilities {
  canSendMessages: boolean;
  canReceiveMessages: boolean;
  canAccessCRM: boolean;
  canAccessERP: boolean;
  canAccessPayment: boolean;
  canCreateTemplates: boolean;
  canScheduleMessages: boolean;
  maxTokensPerRequest: number;
  responseTimeLimit: number;
}

export interface AgentConfig {
  id?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  retryAttempts: number;
  escalationThreshold: number;
  memoryRetentionDays: number;
  learningEnabled: boolean;
}

export interface ConversationMetrics {
  totalMessages: number;
  averageResponseTime: number;
  userSatisfaction: number;
  resolutionRate: number;
  escalationCount: number;
  lastActivity: string;
}

export interface DashboardMetrics {
  activeConversations: number;
  messagesToday: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  averageResponseTime: number;
  resolutionRate: number;
  userSatisfaction: number;
  agentUtilization: Record<string, number>;
  templateUsage: Record<string, number>;
}

export interface MemorySearchResult {
  id: string;
  content: string;
  relevance: number;
  type: 'fact' | 'preference' | 'context' | 'learning' | 'pattern';
  createdAt: string;
  lastAccessedAt: string;
}

export interface WebhookPayload {
  event: string;
  data: {
    message?: UAZMessage;
    template?: UAZTemplate;
    instance?: {
      id: string;
      status: 'connected' | 'disconnected' | 'connecting';
    };
  };
  timestamp: number;
}

export interface RBACPermissions {
  agents: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  templates: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    approve: boolean;
  };
  conversations: {
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  analytics: {
    read: boolean;
    export: boolean;
  };
  users: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  company: {
    read: boolean;
    update: boolean;
  };
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'manager' | 'analyst' | 'viewer';
  companyId: string;
  companyName: string;
  permissions: RBACPermissions;
  lastLoginAt: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Onboarding types
export interface OnboardingData {
  // Dados pessoais
  firstName: string;
  lastName: string;
  
  // Dados da empresa
  companyName: string;
  position: string;
  companySize: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  industry: string;
  
  // Dados de contato
  whatsappPhone: string;
  
  // Metadados
  completedAt?: Date;
  isCompleted: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  fields: OnboardingField[];
  isOptional?: boolean;
}

export interface OnboardingField {
  name: keyof OnboardingData;
  type: 'text' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    custom?: (value: string) => string | null;
  };
}

// Form types
export interface CreateAgentForm {
  name: string;
  type: 'sales' | 'support' | 'marketing' | 'finance' | 'orchestrator';
  description?: string;
  systemPrompt: string;
  capabilities: AgentCapabilities;
  config: AgentConfig;
}

export interface CreateTemplateForm {
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  content: UAZTemplate['content'];
}

export interface CreateUserForm {
  phoneNumber: string;
  name: string;
  companyId: string;
  preferences?: Record<string, unknown>;
}

// Filter types
export interface ConversationFilters {
  status?: string[];
  priority?: string[];
  agentId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface MessageFilters {
  type?: string[];
  status?: string[];
  senderType?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AgentFilters {
  type?: string[];
  isActive?: boolean;
  search?: string;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

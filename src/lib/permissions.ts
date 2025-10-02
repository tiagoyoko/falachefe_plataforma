import { roleEnum } from "./schema";

// Tipos de roles
export type Role = typeof roleEnum.enumValues[number];

// Definição de permissões
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EDIT: 'dashboard:edit',
  
  // Agents
  AGENTS_VIEW: 'agents:view',
  AGENTS_CREATE: 'agents:create',
  AGENTS_EDIT: 'agents:edit',
  AGENTS_DELETE: 'agents:delete',
  AGENTS_TEST: 'agents:test',
  
  // Conversations
  CONVERSATIONS_VIEW: 'conversations:view',
  CONVERSATIONS_EDIT: 'conversations:edit',
  CONVERSATIONS_DELETE: 'conversations:delete',
  CONVERSATIONS_EXPORT: 'conversations:export',
  
  // Templates
  TEMPLATES_VIEW: 'templates:view',
  TEMPLATES_CREATE: 'templates:create',
  TEMPLATES_EDIT: 'templates:edit',
  TEMPLATES_DELETE: 'templates:delete',
  TEMPLATES_APPROVE: 'templates:approve',
  
  // Users/Subscribers
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_EXPORT: 'users:export',
  
  // Companies
  COMPANIES_VIEW: 'companies:view',
  COMPANIES_EDIT: 'companies:edit',
  COMPANIES_DELETE: 'companies:delete',
  
  // Admin Users
  ADMIN_USERS_VIEW: 'admin_users:view',
  ADMIN_USERS_CREATE: 'admin_users:create',
  ADMIN_USERS_EDIT: 'admin_users:edit',
  ADMIN_USERS_DELETE: 'admin_users:delete',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Audit Logs
  AUDIT_LOGS_VIEW: 'audit_logs:view',
  
  // Memory Management
  MEMORY_VIEW: 'memory:view',
  MEMORY_EDIT: 'memory:edit',
  MEMORY_DELETE: 'memory:delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Mapeamento de roles para permissões
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    // Todas as permissões
    ...Object.values(PERMISSIONS)
  ],
  
  manager: [
    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_EDIT,
    
    // Agents
    PERMISSIONS.AGENTS_VIEW,
    PERMISSIONS.AGENTS_CREATE,
    PERMISSIONS.AGENTS_EDIT,
    PERMISSIONS.AGENTS_TEST,
    
    // Conversations
    PERMISSIONS.CONVERSATIONS_VIEW,
    PERMISSIONS.CONVERSATIONS_EDIT,
    PERMISSIONS.CONVERSATIONS_EXPORT,
    
    // Templates
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.TEMPLATES_CREATE,
    PERMISSIONS.TEMPLATES_EDIT,
    PERMISSIONS.TEMPLATES_APPROVE,
    
    // Users/Subscribers
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_EXPORT,
    
    // Companies
    PERMISSIONS.COMPANIES_VIEW,
    PERMISSIONS.COMPANIES_EDIT,
    
    // Settings
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    
    // Analytics
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    
    // Memory Management
    PERMISSIONS.MEMORY_VIEW,
    PERMISSIONS.MEMORY_EDIT,
  ],
  
  analyst: [
    // Dashboard (somente visualização)
    PERMISSIONS.DASHBOARD_VIEW,
    
    // Agents (somente visualização e teste)
    PERMISSIONS.AGENTS_VIEW,
    PERMISSIONS.AGENTS_TEST,
    
    // Conversations (somente visualização)
    PERMISSIONS.CONVERSATIONS_VIEW,
    PERMISSIONS.CONVERSATIONS_EXPORT,
    
    // Templates (somente visualização)
    PERMISSIONS.TEMPLATES_VIEW,
    
    // Users/Subscribers (somente visualização)
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_EXPORT,
    
    // Companies (somente visualização)
    PERMISSIONS.COMPANIES_VIEW,
    
    // Analytics
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    
    // Memory (somente visualização)
    PERMISSIONS.MEMORY_VIEW,
  ],
  
  viewer: [
    // Apenas visualização básica
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.AGENTS_VIEW,
    PERMISSIONS.CONVERSATIONS_VIEW,
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.COMPANIES_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

// Função para verificar se um role tem uma permissão específica
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Função para verificar múltiplas permissões (todas devem ser verdadeiras)
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

// Função para verificar se tem pelo menos uma das permissões
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Função para obter todas as permissões de um role
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// Função para verificar se um role pode acessar uma rota específica
export function canAccessRoute(role: Role, route: string): boolean {
  // Mapeamento de rotas para permissões
  const routePermissions: Record<string, Permission[]> = {
    '/dashboard': [PERMISSIONS.DASHBOARD_VIEW],
    '/agents': [PERMISSIONS.AGENTS_VIEW],
    '/conversations': [PERMISSIONS.CONVERSATIONS_VIEW],
    '/templates': [PERMISSIONS.TEMPLATES_VIEW],
    '/subscribers': [PERMISSIONS.USERS_VIEW],
    '/admin': [PERMISSIONS.ADMIN_USERS_VIEW],
    '/settings': [PERMISSIONS.SETTINGS_VIEW],
    '/analytics': [PERMISSIONS.ANALYTICS_VIEW],
    '/memory': [PERMISSIONS.MEMORY_VIEW],
  };

  const requiredPermissions = routePermissions[route] || [];
  return hasAnyPermission(role, requiredPermissions);
}

// Função para obter descrição de um role
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    super_admin: 'Administrador com acesso total ao sistema',
    manager: 'Gerente com acesso a configurações e relatórios',
    analyst: 'Analista com acesso de visualização e exportação',
    viewer: 'Visualizador com acesso somente leitura',
  };

  return descriptions[role] || 'Role não reconhecido';
}

// Função para obter lista de roles disponíveis
export function getAvailableRoles(): { value: Role; label: string; description: string }[] {
  return Object.values(roleEnum.enumValues).map(role => ({
    value: role,
    label: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: getRoleDescription(role),
  }));
}

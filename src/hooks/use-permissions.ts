"use client";

import { useSession } from "@/lib/auth-client";
import { type Permission, type Role, hasPermission, hasAllPermissions, hasAnyPermission, canAccessRoute } from "@/lib/permissions";

export function usePermissions() {
  const { data: session, isPending } = useSession();

  // Obter role do usuário (você pode ajustar isso baseado na sua estrutura de dados)
  const userRole: Role | null = session?.user ? 'analyst' : null; // Temporário - ajustar conforme implementação

  const isLoading = isPending;

  // Verificar se usuário tem uma permissão específica
  const can = (permission: Permission): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };

  // Verificar se usuário tem todas as permissões
  const canAll = (permissions: Permission[]): boolean => {
    if (!userRole) return false;
    return hasAllPermissions(userRole, permissions);
  };

  // Verificar se usuário tem pelo menos uma das permissões
  const canAny = (permissions: Permission[]): boolean => {
    if (!userRole) return false;
    return hasAnyPermission(userRole, permissions);
  };

  // Verificar se usuário pode acessar uma rota
  const canAccess = (route: string): boolean => {
    if (!userRole) return false;
    return canAccessRoute(userRole, route);
  };

  // Verificar se usuário é um role específico
  const isRole = (role: Role): boolean => {
    return userRole === role;
  };

  // Verificar se usuário é admin (super_admin ou manager)
  const isAdmin = (): boolean => {
    return userRole === ('super_admin' as Role) || userRole === ('manager' as Role);
  };

  // Verificar se usuário é super admin
  const isSuperAdmin = (): boolean => {
    return userRole === ('super_admin' as Role);
  };

  return {
    // Estado
    userRole,
    isLoading,
    isAuthenticated: !!session?.user,

    // Funções de verificação
    can,
    canAll,
    canAny,
    canAccess,
    isRole,
    isAdmin,
    isSuperAdmin,

    // Utilitários
    hasRole: isRole,
    hasPermission: can,
    hasAllPermissions: canAll,
    hasAnyPermission: canAny,
  };
}

// Hook para proteger componentes baseado em permissões
export function usePermissionGuard(permission: Permission | Permission[]) {
  const { can, canAll, isLoading } = usePermissions();

  if (isLoading) {
    return { canAccess: false, isLoading: true };
  }

  if (Array.isArray(permission)) {
    return { canAccess: canAll(permission), isLoading: false };
  }

  return { canAccess: can(permission), isLoading: false };
}

// Hook para proteger rotas
export function useRouteGuard(route: string) {
  const { canAccess, isLoading } = usePermissions();

  return {
    canAccess: isLoading ? false : canAccess(route),
    isLoading,
  };
}
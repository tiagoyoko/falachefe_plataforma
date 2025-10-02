"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { type Permission } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Lock } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission | Permission[];
  requireAll?: boolean; // Se true, requer todas as permissões; se false, requer qualquer uma
  fallback?: ReactNode;
  showError?: boolean;
}

export function PermissionGuard({ 
  children, 
  permission, 
  requireAll = true,
  fallback,
  showError = true 
}: PermissionGuardProps) {
  const { can, canAll, canAny, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!permission) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (Array.isArray(permission)) {
    hasAccess = requireAll ? canAll(permission) : canAny(permission);
  } else {
    hasAccess = can(permission);
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showError) {
      return null;
    }

    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Você não tem permissão para acessar este conteúdo. Entre em contato com o administrador se acredita que isso é um erro.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  children: ReactNode;
  roles: string | string[];
  fallback?: ReactNode;
  showError?: boolean;
}

export function RoleGuard({ 
  children, 
  roles, 
  fallback,
  showError = true 
}: RoleGuardProps) {
  const { isRole, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const hasAccess = allowedRoles.some(role => isRole(role as "super_admin" | "manager" | "analyst" | "viewer"));

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showError) {
      return null;
    }

    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Acesso Restrito</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Esta funcionalidade está restrita a usuários com roles específicos: {allowedRoles.join(", ")}.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

export function AdminGuard({ 
  children, 
  fallback,
  showError = true 
}: AdminGuardProps) {
  const { isAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showError) {
      return null;
    }

    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Acesso de Administrador Necessário</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Esta funcionalidade está restrita a administradores do sistema.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

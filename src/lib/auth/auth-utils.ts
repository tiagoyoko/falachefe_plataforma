import { db } from "./db";
import { user } from "./better-auth-schema";
import { eq } from "drizzle-orm";

export type Role = 'super_admin' | 'manager' | 'analyst' | 'viewer';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FullUser extends SessionUser {
  role: Role;
  isActive: boolean;
  emailVerified: boolean | null;
}

/**
 * Busca o usuário completo com role a partir da sessão
 */
export async function getFullUser(sessionUser: SessionUser): Promise<FullUser | null> {
  const fullUser = await db.query.user.findFirst({
    where: eq(user.id, sessionUser.id),
    columns: {
      id: true,
      email: true,
      name: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      isActive: true
    }
  });

  return fullUser || null;
}

/**
 * Verifica se o usuário tem uma das roles especificadas
 */
export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Verifica se o usuário é super admin
 */
export function isSuperAdmin(userRole: Role): boolean {
  return userRole === 'super_admin';
}

/**
 * Verifica se o usuário é manager ou superior
 */
export function isManagerOrAbove(userRole: Role): boolean {
  return ['super_admin', 'manager'].includes(userRole);
}

/**
 * Verifica se o usuário é analyst ou superior
 */
export function isAnalystOrAbove(userRole: Role): boolean {
  return ['super_admin', 'manager', 'analyst'].includes(userRole);
}

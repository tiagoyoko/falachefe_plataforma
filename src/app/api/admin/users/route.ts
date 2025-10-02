import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/auth-schema";
import { eq } from "drizzle-orm";

// GET /api/admin/users - Listar usuários admin
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // TODO: Verificar se o usuário tem permissão ADMIN_USERS_VIEW
    // Por enquanto, permitir para todos os usuários autenticados

    // Buscar usuários admin
    const users = await db
      .select()
      .from(adminUsers)
      .orderBy(adminUsers.createdAt);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Erro ao buscar usuários admin:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Criar usuário admin
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // TODO: Verificar se o usuário tem permissão ADMIN_USERS_CREATE
    // Por enquanto, permitir para todos os usuários autenticados

    const body = await request.json();
    const { email, name, role, companyId } = body;

    // Validar dados obrigatórios
    if (!email || !name || !role || !companyId) {
      return NextResponse.json(
        { error: "Email, nome, role e companyId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const existingUser = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 409 }
      );
    }

    // Criar usuário admin
    const newUser = await db
      .insert(adminUsers)
      .values({
        email,
        name,
        role,
        companyId,
        isActive: true,
      })
      .returning();

    return NextResponse.json(
      { user: newUser[0], message: "Usuário admin criado com sucesso" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário admin:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

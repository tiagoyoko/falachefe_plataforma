import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/auth-schema";
import { eq } from "drizzle-orm";

// GET /api/admin/users/[id] - Buscar usuário admin específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // TODO: Verificar se o usuário tem permissão ADMIN_USERS_VIEW

    const userId = id;

    // Buscar usuário admin
    const user = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: user[0] });
  } catch (error) {
    console.error("Erro ao buscar usuário admin:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Atualizar usuário admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // TODO: Verificar se o usuário tem permissão ADMIN_USERS_EDIT

    const userId = id;
    const body = await request.json();
    const { name, role, isActive } = body;

    // Verificar se o usuário existe
    const existingUser = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Atualizar usuário
    const updatedUser = await db
      .update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, userId))
      .returning();

    return NextResponse.json({
      user: updatedUser[0],
      message: "Usuário atualizado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário admin:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Deletar usuário admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // TODO: Verificar se o usuário tem permissão ADMIN_USERS_DELETE

    const userId = id;

    // Verificar se o usuário existe
    const existingUser = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Deletar usuário (soft delete - marcar como inativo)
    await db
      .update(adminUsers)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(adminUsers.id, userId));

    return NextResponse.json({
      message: "Usuário desativado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao deletar usuário admin:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
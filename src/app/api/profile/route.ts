import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userOnboarding } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";

/**
 * PUT /api/profile - Atualiza dados do perfil do usuário
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { section, fields } = data;

    // Validar que a seção foi especificada
    if (!section) {
      return NextResponse.json(
        { error: "Seção não especificada" },
        { status: 400 }
      );
    }

    // Buscar onboarding existente
    const existingOnboarding = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, session.user.id))
      .limit(1);

    if (existingOnboarding.length === 0) {
      return NextResponse.json(
        { error: "Dados de onboarding não encontrados. Complete o onboarding primeiro." },
        { status: 404 }
      );
    }

    // Preparar dados para atualização baseado na seção
    const updateData: {
      updatedAt: Date;
      firstName?: string;
      lastName?: string;
      whatsappPhone?: string;
      position?: string;
      companyName?: string;
      industry?: string;
      companySize?: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
    } = {
      updatedAt: new Date(),
    };

    if (section === 'personalInfo') {
      // Atualizar campos pessoais
      if (fields.name) {
        const [firstName, ...lastNameParts] = fields.name.trim().split(' ');
        updateData.firstName = firstName;
        updateData.lastName = lastNameParts.join(' ') || firstName;
      }
      if (fields.phone) {
        updateData.whatsappPhone = fields.phone;
      }
      if (fields.position) {
        updateData.position = fields.position;
      }
    } else if (section === 'companyInfo') {
      // Atualizar campos da empresa
      if (fields.name) {
        updateData.companyName = fields.name;
      }
      if (fields.industry) {
        updateData.industry = fields.industry;
      }
      if (fields.size) {
        // Validar tamanho da empresa
        const validCompanySizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
        if (validCompanySizes.includes(fields.size)) {
          updateData.companySize = fields.size;
        }
      }
      // cnpj, website e address não estão na tabela user_onboarding ainda
      // TODO: Adicionar essas colunas ou criar tabela separada para company_details
    } else if (section === 'preferences') {
      // TODO: Preferências ainda não estão no banco
      // Criar tabela user_preferences ou adicionar colunas JSONB
      console.log('⚠️ Preferências ainda não implementadas no banco:', fields);
      return NextResponse.json({
        success: true,
        message: "Preferências salvas localmente (implementação do banco pendente)",
        warning: "Preferências não são persistidas ainda"
      });
    }

    // Executar update no banco
    if (Object.keys(updateData).length > 1) { // > 1 porque updatedAt sempre está presente
      await db
        .update(userOnboarding)
        .set(updateData)
        .where(eq(userOnboarding.userId, session.user.id));

      console.log('✅ Perfil atualizado:', {
        userId: session.user.id,
        section,
        fields: Object.keys(updateData)
      });

      return NextResponse.json({
        success: true,
        message: "Perfil atualizado com sucesso",
        updated: updateData
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Nenhum campo válido para atualizar"
      }, { status: 400 });
    }

  } catch (error) {
    console.error("❌ Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile - Retorna dados do perfil
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const onboarding = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, session.user.id))
      .limit(1);

    if (onboarding.length === 0) {
      return NextResponse.json(
        { error: "Dados de perfil não encontrados" },
        { status: 404 }
      );
    }

    const data = onboarding[0];

    return NextResponse.json({
      success: true,
      data: {
        personalInfo: {
          name: `${data.firstName} ${data.lastName}`,
          email: session.user.email || "",
          phone: data.whatsappPhone,
          position: data.position,
        },
        companyInfo: {
          name: data.companyName,
          industry: data.industry,
          size: data.companySize,
        },
        preferences: {
          // TODO: Buscar de tabela preferences quando implementado
        }
      }
    });

  } catch (error) {
    console.error("❌ Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

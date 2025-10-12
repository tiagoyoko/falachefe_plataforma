import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userOnboarding } from "@/lib/schema";
import { companies, userSubscriptions, subscriptionPlans } from "@/lib/billing-schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
// TODO: Reativar integração com perfil quando necessário
// import { userProfileManager } from "@/agents/memory/user-profile";

export async function POST(request: NextRequest) {
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

    // Validar dados obrigatórios
    const requiredFields = [
      'firstName',
      'lastName', 
      'companyName',
      'position',
      'companySize',
      'industry',
      'whatsappPhone'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validar tamanho da empresa
    const validCompanySizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
    if (!validCompanySizes.includes(data.companySize)) {
      return NextResponse.json(
        { error: "Tamanho da empresa inválido" },
        { status: 400 }
      );
    }

    // Verificar se já existe onboarding para este usuário
    const existingOnboarding = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, session.user.id))
      .limit(1);

    if (existingOnboarding.length > 0) {
      // Atualizar onboarding existente
      await db
        .update(userOnboarding)
        .set({
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: data.companyName,
          position: data.position,
          companySize: data.companySize,
          industry: data.industry,
          whatsappPhone: data.whatsappPhone,
          isCompleted: data.isCompleted || false,
          completedAt: data.completedAt ? new Date(data.completedAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(userOnboarding.userId, session.user.id));

      // TODO: Integrar com sistema de perfil do agente quando necessário
      // try {
      //   await userProfileManager.updateUserProfile(session.user.id, {
      //     personalInfo: {
      //       name: `${data.firstName} ${data.lastName}`,
      //       company: data.companyName,
      //       position: data.position,
      //       industry: data.industry,
      //       companySize: data.companySize
      //     },
      //     businessContext: {
      //       businessType: 'Empresa', // Valor padrão
      //       mainChallenges: [],
      //       goals: [],
      //       priorities: []
      //     }
      //   });
      //   console.log('✅ Dados do onboarding integrados com sistema de perfil do agente');
      // } catch (profileError) {
      //   console.warn('⚠️ Erro ao integrar com sistema de perfil:', profileError);
      //   // Não falhar o onboarding por causa do perfil
      // }

      return NextResponse.json({
        success: true,
        message: "Onboarding atualizado com sucesso",
      });
    } else {
      // Criar novo onboarding
      await db.insert(userOnboarding).values({
        userId: session.user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        position: data.position,
        companySize: data.companySize,
        industry: data.industry,
        whatsappPhone: data.whatsappPhone,
        isCompleted: data.isCompleted || false,
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
      });

      // TODO: Integrar com sistema de perfil do agente quando necessário
      // try {
      //   await userProfileManager.updateUserProfile(session.user.id, {
      //     personalInfo: {
      //       name: `${data.firstName} ${data.lastName}`,
      //       company: data.companyName,
      //       position: data.position,
      //       industry: data.industry,
      //       companySize: data.companySize
      //     },
      //     businessContext: {
      //       businessType: 'Empresa', // Valor padrão
      //       mainChallenges: [],
      //       goals: [],
      //       priorities: []
      //     }
      //   });
      //   console.log('✅ Dados do onboarding integrados com sistema de perfil do agente');
      // } catch (profileError) {
      //   console.warn('⚠️ Erro ao integrar com sistema de perfil:', profileError);
      //   // Não falhar o onboarding por causa do perfil
      // }

      // ✨ NOVO: Criar empresa e subscription automaticamente quando onboarding completado
      if (data.isCompleted) {
        try {
          console.log('🏢 Onboarding completado: criando empresa e subscription...');
          
          // 1. Criar ou buscar empresa
          const company = await db.select()
            .from(companies)
            .where(eq(companies.name, data.companyName))
            .limit(1);
          
          let companyId: string;
          
          if (company.length === 0) {
            // Criar nova empresa
            const [newCompany] = await db.insert(companies).values({
              name: data.companyName,
              domain: data.companyName.toLowerCase().replace(/\s+/g, '') + '.falachefe.app.br',
              uazToken: '', // Será preenchido depois ao conectar WhatsApp
              uazAdminToken: '',
              subscriptionPlan: 'starter',
              isActive: true,
              settings: {},
            }).returning();
            
            companyId = newCompany.id;
            console.log('✅ Empresa criada:', newCompany.name);
          } else {
            companyId = company[0].id;
            console.log('✅ Empresa existente encontrada:', company[0].name);
          }
          
          // 2. Buscar plano starter
          const starterPlan = await db.select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.slug, 'starter'))
            .limit(1);
          
          if (starterPlan.length === 0) {
            console.error('❌ Plano starter não encontrado!');
          } else {
            // 3. Verificar se já existe subscription
            const existingSubscription = await db.select()
              .from(userSubscriptions)
              .where(eq(userSubscriptions.userId, session.user.id))
              .limit(1);
            
            if (existingSubscription.length === 0) {
              // Criar subscription
              await db.insert(userSubscriptions).values({
                userId: session.user.id,
                companyId: companyId,
                planId: starterPlan[0].id,
                status: 'active',
                billingCycle: 'monthly',
                startDate: new Date(),
              });
              
              console.log('✅ Subscription criada:', {
                userId: session.user.id,
                companyId: companyId,
                planId: starterPlan[0].id
              });
            } else {
              console.log('ℹ️ Subscription já existe para este usuário');
            }
          }
        } catch (companyError) {
          console.error('❌ Erro ao criar empresa/subscription:', companyError);
          // Não falhar o onboarding por causa disso
          // Usuário pode criar empresa manualmente depois
        }
      }

      return NextResponse.json({
        success: true,
        message: "Onboarding criado com sucesso",
      });
    }
  } catch (error) {
    console.error("Erro ao salvar onboarding:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json({
        isCompleted: false,
      });
    }

    const userOnboardingData = onboarding[0];
    
    return NextResponse.json({
      isCompleted: userOnboardingData.isCompleted,
      completedAt: userOnboardingData.completedAt?.toISOString(),
      data: {
        firstName: userOnboardingData.firstName,
        lastName: userOnboardingData.lastName,
        companyName: userOnboardingData.companyName,
        position: userOnboardingData.position,
        companySize: userOnboardingData.companySize,
        industry: userOnboardingData.industry,
        whatsappPhone: userOnboardingData.whatsappPhone,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar onboarding:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

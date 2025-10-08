import { z } from "zod";
import { db } from "../../lib/db";
import { eq, sql } from "drizzle-orm";
import { userOnboarding } from "../../lib/schema-consolidated";

/**
 * Ferramenta para consultar dados do usuário
 * Configurada para funcionar com OpenAI Agent SDK
 */
export const userQueryTool = {
  name: "query_user_data",
  description: "Consulta dados completos do usuário por email, incluindo informações básicas e de onboarding. Use esta ferramenta quando precisar de informações detalhadas sobre um usuário específico.",
  parameters: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Email do usuário para consulta"
      },
      includeOnboarding: {
        type: "boolean",
        description: "Incluir dados de onboarding na consulta (padrão: true)",
        default: true
      }
    },
    required: ["email"]
  },
  
  async execute({ email, includeOnboarding = true }: { email: string; includeOnboarding?: boolean }) {
    try {
      console.log(`🔍 Agent consultando dados do usuário: ${email}`);
      
      // Buscar usuário por email na tabela 'user' (Better Auth)
      const userResult = await db.execute(sql`
        SELECT * FROM "user" 
        WHERE email = ${email} 
        LIMIT 1
      `);
      
      if (userResult.length === 0) {
        return {
          success: false,
          error: "Usuário não encontrado",
          data: null
        };
      }
      
      const user = userResult[0] as any;
      
      // Buscar dados de onboarding se solicitado
      let onboardingData = null;
      if (includeOnboarding) {
        try {
          const onboardingResult = await db
            .select()
            .from(userOnboarding)
            .where(eq(userOnboarding.userId, user.id))
            .limit(1);
          
          if (onboardingResult.length > 0) {
            onboardingData = onboardingResult[0];
          }
        } catch (error) {
          console.warn("Erro ao buscar dados de onboarding:", error);
          // Não falha a consulta se onboarding não estiver disponível
        }
      }
      
      // Formatar resposta
      const response = {
        success: true,
        data: {
          // Dados básicos do usuário (Better Auth)
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          // Dados de onboarding (se disponível)
          onboarding: onboardingData ? {
            id: onboardingData.id,
            firstName: onboardingData.firstName,
            lastName: onboardingData.lastName,
            companyName: onboardingData.companyName,
            position: onboardingData.position,
            companySize: onboardingData.companySize,
            industry: onboardingData.industry,
            whatsappPhone: onboardingData.whatsappPhone,
            isCompleted: onboardingData.isCompleted,
            completedAt: onboardingData.completedAt,
            createdAt: onboardingData.createdAt,
            updatedAt: onboardingData.updatedAt
          } : null
        }
      };
      
      console.log(`✅ Dados do usuário ${email} consultados com sucesso`);
      return response;
      
    } catch (error) {
      console.error("❌ Erro ao consultar dados do usuário:", error);
      return {
        success: false,
        error: `Erro na consulta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        data: null
      };
    }
  }
};

/**
 * Ferramenta simplificada para consulta rápida de dados básicos
 * Configurada para funcionar com OpenAI Agent SDK
 */
export const userBasicQueryTool = {
  name: "query_user_basic",
  description: "Consulta apenas dados básicos do usuário (mais rápido). Use quando precisar apenas de informações essenciais como nome, email e status.",
  parameters: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Email do usuário para consulta"
      }
    },
    required: ["email"]
  },
  
  async execute({ email }: { email: string }) {
    try {
      console.log(`🔍 Agent consultando dados básicos do usuário: ${email}`);
      
      const userResult = await db.execute(sql`
        SELECT id, name, email, role, "isActive", "createdAt" 
        FROM "user" 
        WHERE email = ${email} 
        LIMIT 1
      `);
      
      if (userResult.length === 0) {
        return {
          success: false,
          error: "Usuário não encontrado",
          data: null
        };
      }
      
      const user = userResult[0] as any;
      
      return {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      };
      
    } catch (error) {
      console.error("❌ Erro ao consultar dados básicos:", error);
      return {
        success: false,
        error: `Erro na consulta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        data: null
      };
    }
  }
};

/**
 * Ferramenta para consultar dados de onboarding específicos
 * Configurada para funcionar com OpenAI Agent SDK
 */
export const userOnboardingQueryTool = {
  name: "query_user_onboarding",
  description: "Consulta dados de onboarding do usuário por email. Use quando precisar de informações sobre empresa, cargo, WhatsApp e status de onboarding.",
  parameters: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Email do usuário para consultar onboarding"
      }
    },
    required: ["email"]
  },
  
  async execute({ email }: { email: string }) {
    try {
      // Buscar userId por email primeiro
      const userResult = await db.execute(sql`
        SELECT id FROM "user" 
        WHERE email = ${email} 
        LIMIT 1
      `);
      
      if (userResult.length === 0) {
        return {
          success: false,
          error: "Usuário não encontrado",
          data: null
        };
      }
      
      const targetUserId = userResult[0].id;
      
      console.log(`🔍 Agent consultando onboarding do usuário: ${targetUserId}`);
      
      const onboardingResult = await db
        .select()
        .from(userOnboarding)
        .where(eq(userOnboarding.userId, targetUserId as string))
        .limit(1);
      
      if (onboardingResult.length === 0) {
        return {
          success: false,
          error: "Dados de onboarding não encontrados",
          data: null
        };
      }
      
      return {
        success: true,
        data: onboardingResult[0]
      };
      
    } catch (error) {
      console.error("❌ Erro ao consultar onboarding:", error);
      return {
        success: false,
        error: `Erro na consulta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        data: null
      };
    }
  }
};

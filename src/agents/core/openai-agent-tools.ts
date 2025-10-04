/**
 * Configuração de ferramentas para OpenAI Agent SDK
 * Segue o padrão oficial do OpenAI para definição de ferramentas
 */

import { userQueryTool, userBasicQueryTool, userOnboardingQueryTool } from './user-query-tool';
import { userProfileTool } from './user-profile-tool';

/**
 * Definição de ferramentas no formato OpenAI Agent SDK
 * Cada ferramenta segue o padrão: name, description, parameters (JSON Schema)
 */
export const openaiAgentTools = [
  {
    type: "function" as const,
    function: {
      name: userQueryTool.name,
      description: userQueryTool.description,
      parameters: userQueryTool.parameters
    }
  },
  {
    type: "function" as const,
    function: {
      name: userBasicQueryTool.name,
      description: userBasicQueryTool.description,
      parameters: userBasicQueryTool.parameters
    }
  },
  {
    type: "function" as const,
    function: {
      name: userOnboardingQueryTool.name,
      description: userOnboardingQueryTool.description,
      parameters: userOnboardingQueryTool.parameters
    }
  },
  // userProfileTool será adicionado quando estiver disponível
];

/**
 * Mapeamento de ferramentas para execução
 * Conecta os nomes das ferramentas com suas funções de execução
 */
export const toolExecutors = {
  [userQueryTool.name]: userQueryTool.execute,
  [userBasicQueryTool.name]: userBasicQueryTool.execute,
  [userOnboardingQueryTool.name]: userOnboardingQueryTool.execute
  // userProfileTool será adicionado quando estiver disponível
};

/**
 * Configuração completa para OpenAI Agent SDK
 */
export const openaiAgentConfig = {
  tools: openaiAgentTools,
  toolExecutors,
  
  // Configurações específicas para diferentes tipos de agentes
  agentConfigs: {
    financial: {
      tools: openaiAgentTools.filter(tool => 
        ['query_user_data', 'query_user_basic', 'query_user_onboarding'].includes(tool.function.name)
      ),
      description: "Agent especializado em questões financeiras com acesso a dados do usuário"
    },
    
    support: {
      tools: openaiAgentTools.filter(tool => 
        ['query_user_data', 'query_user_basic', 'query_user_onboarding'].includes(tool.function.name)
      ),
      description: "Agent de suporte com acesso a informações do usuário para atendimento personalizado"
    },
    
    sales: {
      tools: openaiAgentTools.filter(tool => 
        ['query_user_data', 'query_user_onboarding'].includes(tool.function.name)
      ),
      description: "Agent de vendas com acesso a dados de onboarding para personalização"
    },
    
    general: {
      tools: openaiAgentTools,
      description: "Agent geral com acesso a todas as ferramentas de usuário"
    }
  }
};

/**
 * Função para obter ferramentas por tipo de agente
 */
export function getToolsForAgentType(agentType: keyof typeof openaiAgentConfig.agentConfigs) {
  return openaiAgentConfig.agentConfigs[agentType]?.tools || openaiAgentTools;
}

/**
 * Função para executar uma ferramenta por nome
 */
export async function executeTool(toolName: string, parameters: any) {
  const executor = toolExecutors[toolName];
  if (!executor) {
    throw new Error(`Ferramenta não encontrada: ${toolName}`);
  }
  
  return await executor(parameters);
}

/**
 * Validação de parâmetros de ferramenta
 */
export function validateToolParameters(toolName: string, parameters: any): boolean {
  const tool = openaiAgentTools.find(t => t.function.name === toolName);
  if (!tool) {
    return false;
  }
  
  // Validação básica - em produção, usar uma biblioteca como ajv
  const required = tool.function.parameters.required || [];
  return required.every((field: string) => parameters[field] !== undefined);
}

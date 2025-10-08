/**
 * Configuração de ferramentas disponíveis para os agents
 * Centraliza todas as ferramentas que os agents podem usar
 */

import { userQueryTool, userBasicQueryTool, userOnboardingQueryTool } from './user-query-tool';
import { userProfileTool } from './user-profile-tool';

/**
 * Ferramentas disponíveis para todos os agents
 */
export const availableAgentTools = [
  userQueryTool,
  userBasicQueryTool, 
  userOnboardingQueryTool,
  userProfileTool
];

/**
 * Ferramentas específicas por tipo de agent
 */
export const agentToolsByType = {
  // Agent Financeiro
  financial: [
    userQueryTool,
    userBasicQueryTool,
    userOnboardingQueryTool,
    userProfileTool
  ],
  
  // Agent de Atendimento
  support: [
    userQueryTool,
    userBasicQueryTool,
    userOnboardingQueryTool,
    userProfileTool
  ],
  
  // Agent de Vendas
  sales: [
    userQueryTool,
    userBasicQueryTool,
    userOnboardingQueryTool,
    userProfileTool
  ],
  
  // Agent Geral
  general: [
    userQueryTool,
    userBasicQueryTool,
    userOnboardingQueryTool,
    userProfileTool
  ]
};

/**
 * Obtém ferramentas para um tipo específico de agent
 */
export function getToolsForAgentType(agentType: keyof typeof agentToolsByType) {
  return agentToolsByType[agentType] || availableAgentTools;
}

/**
 * Obtém todas as ferramentas disponíveis
 */
export function getAllAvailableTools() {
  return availableAgentTools;
}

/**
 * Configuração de ferramentas para o sistema de agentes
 */
export const agentToolsConfig = {
  availableTools: availableAgentTools,
  toolsByType: agentToolsByType,
  getToolsForAgentType,
  getAllAvailableTools
};

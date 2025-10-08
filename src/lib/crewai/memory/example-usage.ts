import { initializeMemoryManager, getMemoryManager } from './memory-manager';

/**
 * Exemplo de uso do Sistema de Memória
 * 
 * Este arquivo demonstra como usar o sistema de memória individual e compartilhada
 * para manter contexto entre conversas e compartilhar informações entre agentes.
 */

export async function exampleUsage() {
  // Inicializar o gerenciador de memória
  const memoryManager = await initializeMemoryManager();

  const conversationId = 'conv-123';
  const agentType = 'financial-agent';

  try {
    // ===== MEMÓRIA INDIVIDUAL =====
    console.log('=== Memória Individual ===');

    // Definir memória individual do agente
    await memoryManager.setIndividualMemory(conversationId, agentType, {
      userPreferences: {
        currency: 'BRL',
        riskLevel: 'moderate',
        investmentGoals: ['retirement', 'education']
      },
      lastAnalysis: {
        date: new Date().toISOString(),
        portfolio: ['stocks', 'bonds'],
        performance: 0.12
      },
      context: {
        currentStep: 'portfolio-analysis',
        previousRecommendations: ['diversify', 'rebalance']
      }
    });

    // Obter memória individual
    const individualMemory = await memoryManager.getIndividualMemory(conversationId, agentType);
    console.log('Memória Individual:', individualMemory);

    // ===== MEMÓRIA COMPARTILHADA =====
    console.log('\n=== Memória Compartilhada ===');

    // Definir memória compartilhada da conversa
    await memoryManager.setSharedMemory(conversationId, {
      conversationContext: {
        userId: 'user-456',
        sessionId: 'session-789',
        startTime: new Date().toISOString(),
        participants: ['user', 'financial-agent', 'risk-agent']
      },
      sharedData: {
        userProfile: {
          age: 35,
          income: 100000,
          expenses: 60000,
          netWorth: 500000
        },
        marketConditions: {
          interestRate: 0.05,
          inflationRate: 0.03,
          marketVolatility: 'medium'
        },
        decisions: [
          {
            timestamp: new Date().toISOString(),
            agent: 'financial-agent',
            decision: 'recommend-portfolio-rebalance',
            confidence: 0.85
          }
        ]
      }
    });

    // Obter memória compartilhada
    const sharedMemory = await memoryManager.getSharedMemory(conversationId);
    console.log('Memória Compartilhada:', sharedMemory);

    // Atualizar memória compartilhada
    await memoryManager.updateSharedMemory(conversationId, {
      sharedData: {
        ...sharedMemory.sharedData,
        decisions: [
          ...sharedMemory.sharedData.decisions,
          {
            timestamp: new Date().toISOString(),
            agent: 'risk-agent',
            decision: 'approve-recommendation',
            confidence: 0.92
          }
        ]
      }
    });

    // ===== OPERAÇÕES COMBINADAS =====
    console.log('\n=== Operações Combinadas ===');

    // Sincronizar memórias
    await memoryManager.syncMemories(conversationId);
    console.log('Memórias sincronizadas');

    // Obter estatísticas
    const stats = await memoryManager.getStats();
    console.log('Estatísticas:', {
      individualMemories: stats.individual.totalMemories,
      sharedMemories: stats.shared.totalMemories,
      averageGetTime: `${stats.performance.averageGetTime.toFixed(2)}ms`,
      cacheHitRate: `${(stats.performance.cacheHitRate * 100).toFixed(1)}%`
    });

    // ===== CENÁRIO DE USO REAL =====
    console.log('\n=== Cenário de Uso Real ===');

    // Simular uma conversa entre múltiplos agentes
    await simulateMultiAgentConversation(memoryManager, conversationId);

  } catch (error) {
    console.error('Erro no exemplo de uso:', error);
  } finally {
    // Desconectar do sistema de memória
    await memoryManager.disconnect();
  }
}

/**
 * Simula uma conversa entre múltiplos agentes
 */
async function simulateMultiAgentConversation(memoryManager: any, conversationId: string) {
  const agents = ['financial-agent', 'risk-agent', 'compliance-agent'];

  // Cada agente adiciona sua perspectiva
  for (const agent of agents) {
    await memoryManager.setIndividualMemory(conversationId, agent, {
      agentType: agent,
      analysis: {
        timestamp: new Date().toISOString(),
        perspective: getAgentPerspective(agent),
        recommendations: getAgentRecommendations(agent),
        confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0
      }
    });

    // Atualizar memória compartilhada com insights do agente
    const currentShared = await memoryManager.getSharedMemory(conversationId);
    await memoryManager.updateSharedMemory(conversationId, {
      sharedData: {
        ...currentShared.sharedData,
        agentInsights: {
          ...currentShared.sharedData.agentInsights,
          [agent]: {
            lastUpdate: new Date().toISOString(),
            status: 'completed',
            keyFindings: getAgentKeyFindings(agent)
          }
        }
      }
    });

    console.log(`${agent} completou sua análise`);
  }

  // Obter visão consolidada
  const finalSharedMemory = await memoryManager.getSharedMemory(conversationId);
  console.log('Visão consolidada:', finalSharedMemory.sharedData.agentInsights);
}

function getAgentPerspective(agent: string): string {
  const perspectives: Record<string, string> = {
    'financial-agent': 'Análise de performance e recomendações de investimento',
    'risk-agent': 'Avaliação de riscos e adequação do perfil',
    'compliance-agent': 'Verificação de conformidade regulatória'
  };
  return perspectives[agent] || 'Análise geral';
}

function getAgentRecommendations(agent: string): string[] {
  const recommendations: Record<string, string[]> = {
    'financial-agent': ['Diversificar portfólio', 'Aumentar exposição a ações'],
    'risk-agent': ['Manter perfil moderado', 'Considerar hedge contra volatilidade'],
    'compliance-agent': ['Documentar decisões', 'Atualizar KYC']
  };
  return recommendations[agent] || ['Recomendação padrão'];
}

function getAgentKeyFindings(agent: string): string[] {
  const findings: Record<string, string[]> = {
    'financial-agent': ['ROI acima da média', 'Necessidade de rebalanceamento'],
    'risk-agent': ['Perfil de risco adequado', 'Baixa correlação entre ativos'],
    'compliance-agent': ['Documentação completa', 'Conformidade verificada']
  };
  return findings[agent] || ['Achado padrão'];
}

// Executar exemplo se chamado diretamente
if (require.main === module) {
  exampleUsage().catch(console.error);
}

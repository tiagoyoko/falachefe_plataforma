/**
 * Exemplo de como usar as ferramentas de usuário com OpenAI Agent SDK
 * Demonstra a integração correta seguindo a documentação oficial
 */

import OpenAI from 'openai';
import { openaiAgentConfig, executeTool, validateToolParameters } from './openai-agent-tools';

// Configuração do cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Exemplo de agent que usa as ferramentas de consulta de usuário
 */
export class UserAwareAgent {
  private model: string;
  private tools: any[];
  private toolExecutors: any;

  constructor(model: string = 'gpt-4o-mini', agentType: 'financial' | 'support' | 'sales' | 'general' = 'general') {
    this.model = model;
    this.tools = openaiAgentConfig.agentConfigs[agentType].tools;
    this.toolExecutors = openaiAgentConfig.toolExecutors;
  }

  /**
   * Processa uma mensagem do usuário e executa ferramentas se necessário
   */
  async processMessage(userMessage: string, userEmail?: string) {
    try {
      console.log(`🤖 Agent processando mensagem: "${userMessage}"`);
      
      // Preparar mensagens para o chat
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `Você é um agente especializado que pode consultar informações do usuário quando necessário. 
          
          Ferramentas disponíveis:
          - query_user_data: Consulta dados completos do usuário (incluindo onboarding)
          - query_user_basic: Consulta apenas dados básicos (mais rápido)
          - query_user_onboarding: Consulta dados de onboarding específicos
          - user_profile: Consulta perfil detalhado do usuário
          
          Use as ferramentas quando precisar de informações sobre o usuário para personalizar sua resposta.
          ${userEmail ? `O email do usuário atual é: ${userEmail}` : ''}`
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Fazer chamada para o OpenAI com ferramentas
      const response = await openai.chat.completions.create({
        model: this.model,
        messages,
        tools: this.tools,
        tool_choice: 'auto', // Deixa o modelo decidir quando usar ferramentas
        temperature: 0.7,
        max_tokens: 1000
      });

      const message = response.choices[0].message;
      
      // Se o modelo quer usar ferramentas
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`🔧 Agent executando ${message.tool_calls.length} ferramenta(s)...`);
        
        // Executar cada ferramenta solicitada
        const toolResults = await Promise.all(
        message.tool_calls.map(async (toolCall) => {
          const toolName = toolCall.type === 'function' ? toolCall.function.name : '';
          const parameters = toolCall.type === 'function' ? JSON.parse(toolCall.function.arguments) : {};
            
            console.log(`🔧 Executando ferramenta: ${toolName}`, parameters);
            
            // Validar parâmetros
            if (!validateToolParameters(toolName, parameters)) {
              return {
                tool_call_id: toolCall.id,
                role: 'tool' as const,
                content: `Erro: Parâmetros inválidos para a ferramenta ${toolName}`
              };
            }
            
            try {
              // Executar ferramenta
              const result = await executeTool(toolName, parameters);
              
              return {
                tool_call_id: toolCall.id,
                role: 'tool' as const,
                content: JSON.stringify(result)
              };
            } catch (error) {
              console.error(`❌ Erro ao executar ferramenta ${toolName}:`, error);
              return {
                tool_call_id: toolCall.id,
                role: 'tool' as const,
                content: `Erro ao executar ferramenta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
              };
            }
          })
        );
        
        // Adicionar resultados das ferramentas às mensagens
        messages.push(message);
        messages.push(...toolResults);
        
        // Fazer nova chamada para obter resposta final
        const finalResponse = await openai.chat.completions.create({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 1000
        });
        
        return {
          response: finalResponse.choices[0].message.content,
          toolsUsed: message.tool_calls.map(tc => tc.type === 'function' ? tc.function.name : ''),
          toolResults: toolResults.map(tr => tr.content)
        };
      }
      
      // Resposta direta sem ferramentas
      return {
        response: message.content,
        toolsUsed: [],
        toolResults: []
      };
      
    } catch (error) {
      console.error('❌ Erro no processamento da mensagem:', error);
      throw error;
    }
  }
}

/**
 * Exemplo de uso do agent
 */
export async function exampleUsage() {
  const agent = new UserAwareAgent('gpt-4o-mini', 'financial');
  
  try {
    // Exemplo 1: Consulta que requer dados do usuário
    const result1 = await agent.processMessage(
      "Preciso de um relatório financeiro personalizado",
      "tiagoyoko@gmail.com"
    );
    
    console.log('📊 Resultado 1:', result1);
    
    // Exemplo 2: Consulta básica
    const result2 = await agent.processMessage(
      "Qual é o status da minha conta?",
      "tiagoyoko@gmail.com"
    );
    
    console.log('📊 Resultado 2:', result2);
    
  } catch (error) {
    console.error('❌ Erro no exemplo:', error);
  }
}

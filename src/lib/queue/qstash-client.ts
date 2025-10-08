/**
 * Cliente Upstash QStash para enfileirar mensagens
 * Ref: https://upstash.com/docs/qstash/overall/getstarted
 */

export interface QStashConfig {
  token: string;
  url?: string;
}

export interface QueueMessagePayload {
  message: string;
  userId: string;
  phoneNumber: string;
  context: {
    conversationId: string;
    chatName?: string;
    senderName?: string;
    isGroup?: boolean;
    userName?: string;
    isNewUser?: boolean;
  };
}

export class QStashClient {
  private token: string;
  private baseUrl: string;

  constructor(config: QStashConfig) {
    this.token = config.token;
    this.baseUrl = config.url || 'https://qstash.upstash.io';
  }

  /**
   * Enfileira mensagem para processamento assíncrono
   * 
   * @param destination - URL do worker que processará a mensagem
   * @param payload - Dados da mensagem
   * @param options - Opções adicionais (delay, retries, etc)
   */
  async publishMessage(
    destination: string,
    payload: QueueMessagePayload,
    options?: {
      delay?: number; // delay em segundos
      retries?: number; // número de tentativas (padrão: 3)
      callback?: string; // URL para callback após processamento
    }
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Upstash-Forward-Upstash-Message-Id': 'true', // Receber ID da mensagem
      };

      // Adicionar delay se especificado
      if (options?.delay) {
        headers['Upstash-Delay'] = `${options.delay}s`;
      }

      // Adicionar retries
      if (options?.retries !== undefined) {
        headers['Upstash-Retries'] = `${options.retries}`;
      }

      // Adicionar callback
      if (options?.callback) {
        headers['Upstash-Callback'] = options.callback;
      }

      const response = await fetch(`${this.baseUrl}/v2/publish/${encodeURIComponent(destination)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`QStash publish failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.messageId,
      };

    } catch (error) {
      console.error('Error publishing to QStash:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verifica status de uma mensagem
   */
  async getMessageStatus(messageId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get message status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting message status:', error);
      throw error;
    }
  }
}

/**
 * Inicializa cliente QStash com configuração do ambiente
 */
export function createQStashClient(): QStashClient | null {
  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    console.warn('⚠️ QSTASH_TOKEN not configured. Queue disabled.');
    return null;
  }

  return new QStashClient({ token });
}


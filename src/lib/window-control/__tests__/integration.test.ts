/**
 * Testes de integração completos para Window Control Service
 * Testa todas as funcionalidades e cenários de integração
 */

import { WindowControlService } from '../window-service';
import { RedisClient } from '../../cache/redis-client';
import { 
  WindowState, 
  WindowConfig, 
  WindowControlOptions,
  MessageValidationResult,
  TemplateInfo,
  DEFAULT_WINDOW_CONFIG,
  DEFAULT_WINDOW_OPTIONS
} from '../types';

// Mock do RedisClient
jest.mock('../../cache/redis-client');

describe('Window Control Integration Tests', () => {
  let windowService: WindowControlService;
  let mockRedis: jest.Mocked<RedisClient>;
  let customConfig: WindowConfig;
  let customOptions: WindowControlOptions;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Configuração customizada para testes
    customConfig = {
      windowDurationMs: 10000, // 10 segundos para testes rápidos
      maxInactiveTimeMs: 5000, // 5 segundos de inatividade
      cleanupIntervalMs: 1000, // Limpeza a cada segundo
    };

    customOptions = {
      autoRenewOnUserMessage: true,
      autoCloseOnInactivity: true,
      validateTemplates: true,
      logActivity: false, // Desabilitar logs nos testes
    };

    // Mock Redis client
    mockRedis = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(false),
      ttl: jest.fn().mockResolvedValue(-1),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isReady: jest.fn().mockReturnValue(true),
      flushAll: jest.fn().mockResolvedValue(undefined),
      invalidatePattern: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({
        connected: true,
        memory: '1MB',
        keys: 0,
        uptime: 100
      }),
    } as any;

    windowService = new WindowControlService(mockRedis, customConfig, customOptions);
  });

  afterEach(async () => {
    await windowService.destroy();
  });

  describe('Configuração e Inicialização', () => {
    it('deve inicializar com configurações padrão', () => {
      const defaultService = new WindowControlService(mockRedis);
      expect(defaultService).toBeDefined();
    });

    it('deve inicializar com configurações customizadas', () => {
      expect(windowService).toBeDefined();
    });

    it('deve inicializar templates aprovados básicos', () => {
      const templates = windowService.getApprovedTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const templateIds = templates.map(t => t.id);
      expect(templateIds).toContain('welcome');
      expect(templateIds).toContain('confirmation');
      expect(templateIds).toContain('out_of_hours');
    });
  });

  describe('Ciclo de Vida da Janela', () => {
    it('deve criar janela de atendimento corretamente', async () => {
      const userId = 'user123';
      const now = new Date();
      
      const windowState = await windowService.startWindow(userId);
      
      expect(windowState).toBeDefined();
      expect(windowState.userId).toBe(userId);
      expect(windowState.isActive).toBe(true);
      expect(windowState.messageCount).toBe(0);
      expect(windowState.windowStart).toBeInstanceOf(Date);
      expect(windowState.windowEnd).toBeInstanceOf(Date);
      expect(windowState.lastActivity).toBeInstanceOf(Date);
      
      // Verificar se Redis foi chamado
      expect(mockRedis.set).toHaveBeenCalledWith(
        `window:${userId}`,
        expect.objectContaining({
          userId,
          isActive: true,
          messageCount: 0
        }),
        expect.objectContaining({
          ttl: expect.any(Number)
        })
      );
    });

    it('deve renovar janela existente', async () => {
      const userId = 'user123';
      
      // Criar janela inicial
      const initialWindow = await windowService.startWindow(userId);
      
      // Mock Redis para retornar janela existente
      mockRedis.get.mockResolvedValueOnce(initialWindow);
      
      // Renovar janela
      const renewedWindow = await windowService.renewWindow(userId);
      
      expect(renewedWindow).toBeDefined();
      expect(renewedWindow?.messageCount).toBe(1);
      expect(renewedWindow?.lastActivity).toBeInstanceOf(Date);
      expect(renewedWindow?.windowEnd.getTime()).toBeGreaterThanOrEqual(initialWindow.windowEnd.getTime());
    });

    it('deve criar nova janela se não existir ao renovar', async () => {
      const userId = 'user123';
      
      // Mock Redis para retornar null (janela não existe)
      mockRedis.get.mockResolvedValue(null);
      
      const newWindow = await windowService.renewWindow(userId);
      
      expect(newWindow).toBeDefined();
      expect(newWindow?.isActive).toBe(true);
      expect(newWindow?.messageCount).toBe(0);
    });

    it('deve reativar janela inativa ao renovar', async () => {
      const userId = 'user123';
      const inactiveWindow: WindowState = {
        userId,
        windowStart: new Date(Date.now() - 20000),
        windowEnd: new Date(Date.now() - 10000), // Janela expirada
        isActive: false,
        lastActivity: new Date(Date.now() - 15000),
        messageCount: 5
      };
      
      mockRedis.get.mockResolvedValue(inactiveWindow);
      
      const reactivatedWindow = await windowService.renewWindow(userId);
      
      expect(reactivatedWindow).toBeDefined();
      expect(reactivatedWindow?.isActive).toBe(true);
      expect(reactivatedWindow?.messageCount).toBe(0); // Reset contador
    });

    it('deve fechar janela corretamente', async () => {
      const userId = 'user123';
      
      await windowService.startWindow(userId);
      await windowService.closeWindow(userId);
      
      expect(mockRedis.del).toHaveBeenCalledWith(`window:${userId}`);
    });

    it('deve obter estado da janela ativa', async () => {
      const userId = 'user123';
      const now = new Date();
      const windowState: WindowState = {
        userId,
        windowStart: new Date(now.getTime() - 5000),
        windowEnd: new Date(now.getTime() + 5000),
        isActive: true,
        lastActivity: new Date(now.getTime() - 1000),
        messageCount: 3
      };

      mockRedis.get.mockResolvedValue(windowState);

      const state = await windowService.getWindowState(userId);

      expect(state).toBeDefined();
      expect(state?.userId).toBe(userId);
      expect(state?.isActive).toBe(true);
    });

    it('deve retornar undefined para janela expirada', async () => {
      const userId = 'user123';
      const now = new Date();
      const expiredWindow: WindowState = {
        userId,
        windowStart: new Date(now.getTime() - 20000),
        windowEnd: new Date(now.getTime() - 10000), // Janela expirada
        isActive: true,
        lastActivity: new Date(now.getTime() - 15000),
        messageCount: 5
      };

      mockRedis.get.mockResolvedValue(expiredWindow);

      const state = await windowService.getWindowState(userId);

      expect(state).toBeUndefined();
      expect(mockRedis.del).toHaveBeenCalledWith(`window:${userId}`);
    });

    it('deve verificar se janela está ativa', async () => {
      const userId = 'user123';
      const windowState: WindowState = {
        userId,
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 10000),
        isActive: true,
        lastActivity: new Date(),
        messageCount: 1
      };

      mockRedis.get.mockResolvedValue(windowState);

      const isActive = await windowService.isWindowActive(userId);

      expect(isActive).toBe(true);
    });
    });

  describe('Validação de Mensagens', () => {
    it('deve permitir qualquer mensagem com janela ativa', async () => {
      const userId = 'user123';
      const windowState: WindowState = {
        userId,
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 10000),
        isActive: true,
        lastActivity: new Date(),
        messageCount: 1
      };

      mockRedis.get.mockResolvedValue(windowState);

      const validation = await windowService.validateMessage(userId, 'text');
      
      expect(validation.isAllowed).toBe(true);
      expect(validation.requiresTemplate).toBe(false);
      expect(validation.windowState).toBeDefined();
    });

    it('deve permitir template aprovado com janela inativa', async () => {
      const userId = 'user123';
      
      mockRedis.get.mockResolvedValue(null); // Janela inativa
      
      const validation = await windowService.validateMessage(userId, 'template', 'welcome');
      
      expect(validation.isAllowed).toBe(true);
      expect(validation.requiresTemplate).toBe(true);
    });

    it('deve negar mensagem não-template com janela inativa', async () => {
      const userId = 'user123';

      mockRedis.get.mockResolvedValue(null); // Janela inativa
      
      const validation = await windowService.validateMessage(userId, 'text');
      
      expect(validation.isAllowed).toBe(false);
      expect(validation.requiresTemplate).toBe(true);
      expect(validation.reason).toContain('Window is not active');
    });

    it('deve negar template não aprovado com janela inativa', async () => {
      const userId = 'user123';
      
      mockRedis.get.mockResolvedValue(null); // Janela inativa
      
      const validation = await windowService.validateMessage(userId, 'template', 'invalid_template');
      
      expect(validation.isAllowed).toBe(false);
      expect(validation.requiresTemplate).toBe(true);
    });
  });

  describe('Processamento de Mensagens', () => {
    it('deve processar mensagem do usuário com auto-renovação habilitada', async () => {
      const userId = 'user123';
      const windowState: WindowState = {
        userId,
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 10000),
        isActive: true,
        lastActivity: new Date(),
        messageCount: 1
      };
      
      mockRedis.get.mockResolvedValue(windowState);
      
      const result = await windowService.processUserMessage(userId);
      
      expect(result).toBeDefined();
      expect(mockRedis.set).toHaveBeenCalled(); // Janela foi renovada
    });

    it('deve processar mensagem do usuário com auto-renovação desabilitada', async () => {
      const serviceWithoutAutoRenew = new WindowControlService(
        mockRedis, 
        customConfig, 
        { ...customOptions, autoRenewOnUserMessage: false }
      );
      
      const userId = 'user123';
      const windowState: WindowState = {
        userId,
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 10000),
        isActive: true,
        lastActivity: new Date(),
        messageCount: 1
      };
      
      mockRedis.get.mockResolvedValue(windowState);
      
      const result = await serviceWithoutAutoRenew.processUserMessage(userId);
      
      expect(result).toEqual(windowState);
      expect(mockRedis.set).not.toHaveBeenCalled(); // Janela não foi renovada
    });

    it('deve processar mensagem do sistema', async () => {
      const userId = 'user123';
      const windowState: WindowState = {
        userId,
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 10000),
        isActive: true,
        lastActivity: new Date(),
        messageCount: 1
      };
      
      mockRedis.get.mockResolvedValue(windowState);
      
      const validation = await windowService.processSystemMessage(userId, 'text');
      
      expect(validation.isAllowed).toBe(true);
      expect(validation.windowState).toBeDefined();
    });
  });

  describe('Gerenciamento de Templates', () => {
    it('deve adicionar template aprovado', () => {
      const customTemplate: TemplateInfo = {
        id: 'custom_welcome',
        name: 'Boas-vindas Personalizado',
        category: 'utility',
        approved: true,
        content: 'Olá! Bem-vindo ao nosso serviço.'
      };
      
      windowService.addApprovedTemplate(customTemplate);
      
      const templates = windowService.getApprovedTemplates();
      const addedTemplate = templates.find(t => t.id === 'custom_welcome');
      
      expect(addedTemplate).toBeDefined();
      expect(addedTemplate?.content).toBe('Olá! Bem-vindo ao nosso serviço.');
    });

    it('deve remover template aprovado', () => {
      const removed = windowService.removeApprovedTemplate('welcome');
      
      expect(removed).toBe(true);
      
      const templates = windowService.getApprovedTemplates();
      const removedTemplate = templates.find(t => t.id === 'welcome');
      
      expect(removedTemplate).toBeUndefined();
    });

    it('deve retornar false ao tentar remover template inexistente', () => {
      const removed = windowService.removeApprovedTemplate('inexistent_template');
      
      expect(removed).toBe(false);
    });

    it('deve validar template aprovado após adição', async () => {
      const customTemplate: TemplateInfo = {
        id: 'test_template',
        name: 'Template de Teste',
        category: 'utility',
        approved: true,
        content: 'Mensagem de teste'
      };

      windowService.addApprovedTemplate(customTemplate);

      mockRedis.get.mockResolvedValue(null); // Janela inativa
      
      const validation = await windowService.validateMessage('user123', 'template', 'test_template');
      
      expect(validation.isAllowed).toBe(true);
      expect(validation.requiresTemplate).toBe(true);
    });
  });

  describe('Múltiplos Usuários', () => {
    it('deve gerenciar janelas de múltiplos usuários simultaneamente', async () => {
      const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
      
      // Mock Redis para retornar estados de janela para cada usuário
      users.forEach(userId => {
        const windowState = {
          userId,
          windowStart: new Date(),
          windowEnd: new Date(Date.now() + 10000),
          isActive: true,
          lastActivity: new Date(),
          messageCount: 0
        };
        mockRedis.get.mockResolvedValueOnce(windowState);
      });
      
      // Iniciar janelas para todos os usuários
      const windowStates = await Promise.all(
        users.map(userId => windowService.startWindow(userId))
      );
      
      expect(windowStates).toHaveLength(5);
      windowStates.forEach(state => {
        expect(state.isActive).toBe(true);
        expect(state.messageCount).toBe(0);
      });
      
      // Mock Redis para verificação de janelas ativas
      users.forEach(userId => {
        const windowState = {
          userId,
          windowStart: new Date(),
          windowEnd: new Date(Date.now() + 10000),
          isActive: true,
          lastActivity: new Date(),
          messageCount: 0
        };
        mockRedis.get.mockResolvedValueOnce(windowState);
      });
      
      // Verificar se todas as janelas estão ativas
      const activeChecks = await Promise.all(
        users.map(userId => windowService.isWindowActive(userId))
      );
      
      expect(activeChecks.every(isActive => isActive)).toBe(true);
      
      // Fechar todas as janelas
      await Promise.all(
        users.map(userId => windowService.closeWindow(userId))
      );
      
      // Mock Redis para verificação de janelas fechadas (retorna null)
      users.forEach(() => {
        mockRedis.get.mockResolvedValueOnce(null);
      });
      
      // Verificar se todas as janelas foram fechadas
      const inactiveChecks = await Promise.all(
        users.map(userId => windowService.isWindowActive(userId))
      );
      
      expect(inactiveChecks.every(isActive => !isActive)).toBe(true);
    });

    it('deve renovar janelas de múltiplos usuários independentemente', async () => {
      const users = ['user1', 'user2', 'user3'];
      
      // Iniciar janelas
      await Promise.all(
        users.map(userId => windowService.startWindow(userId))
      );
      
      // Mock Redis para retornar janelas existentes
      users.forEach((userId, index) => {
        const windowState: WindowState = {
          userId,
          windowStart: new Date(),
          windowEnd: new Date(Date.now() + 10000),
          isActive: true,
          lastActivity: new Date(),
          messageCount: index
        };
        mockRedis.get.mockResolvedValueOnce(windowState);
      });
      
      // Renovar janelas
      const renewedWindows = await Promise.all(
        users.map(userId => windowService.renewWindow(userId))
      );
      
      expect(renewedWindows).toHaveLength(3);
      renewedWindows.forEach((window, index) => {
        expect(window).toBeDefined();
        expect(window?.messageCount).toBe(index + 1);
      });
    });
  });

  describe('Cenários de Erro', () => {
    it('deve lidar com erros de conexão Redis graciosamente', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      
      await expect(windowService.isWindowActive('user123')).rejects.toThrow('Redis connection failed');
    });

    it('deve lidar com erros de set Redis', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis set failed'));
      
      await expect(windowService.startWindow('user123')).rejects.toThrow('Redis set failed');
    });

    it('deve lidar com erros de delete Redis', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis delete failed'));
      
      await expect(windowService.closeWindow('user123')).rejects.toThrow('Redis delete failed');
    });

    it('deve lidar com Redis desconectado', async () => {
      mockRedis.isReady.mockReturnValue(false);

      const isActive = await windowService.isWindowActive('user123');
      
      expect(isActive).toBe(false);
    });

    it('deve lidar com dados corrompidos no Redis', async () => {
      mockRedis.get.mockResolvedValue('invalid_json_data' as any);
      
      // O serviço não valida dados, então retorna o que está no Redis
      const state = await windowService.getWindowState('user123');
      
      expect(state).toBe('invalid_json_data');
    });
  });

  describe('Performance e Concorrência', () => {
    it('deve lidar com operações rápidas de janela', async () => {
      const userId = 'user123';
      const operations = [];

      // Iniciar janela
      operations.push(windowService.startWindow(userId));

      // Múltiplas renovações
      for (let i = 0; i < 10; i++) {
        mockRedis.get.mockResolvedValue({
          userId,
          windowStart: new Date(),
          windowEnd: new Date(Date.now() + 10000),
          isActive: true,
          lastActivity: new Date(),
          messageCount: i
        });
        operations.push(windowService.renewWindow(userId));
      }

      // Múltiplas validações
      for (let i = 0; i < 20; i++) {
        mockRedis.get.mockResolvedValue({
          userId,
          windowStart: new Date(),
          windowEnd: new Date(Date.now() + 10000),
          isActive: true,
          lastActivity: new Date(),
          messageCount: i
        });
        operations.push(windowService.validateMessage(userId, 'text'));
      }

      const results = await Promise.all(operations);
      
      expect(results.length).toBe(31); // 1 start + 10 renewals + 20 validations
      expect(results.filter(r => r !== undefined).length).toBeGreaterThan(0);
    });

    it('deve lidar com criação simultânea de janelas', async () => {
      const users = Array.from({ length: 50 }, (_, i) => `user${i}`);
      
      const startTime = Date.now();
      
      const windowStates = await Promise.all(
        users.map(userId => windowService.startWindow(userId))
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(windowStates).toHaveLength(50);
      expect(duration).toBeLessThan(5000); // Deve completar em menos de 5 segundos
      
      // Verificar se todas as janelas foram criadas corretamente
      windowStates.forEach((state, index) => {
        expect(state.userId).toBe(`user${index}`);
        expect(state.isActive).toBe(true);
      });
    });

    it('deve lidar com validações simultâneas de mensagens', async () => {
      const userId = 'user123';
      const windowState: WindowState = {
        userId,
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 10000),
        isActive: true,
        lastActivity: new Date(),
        messageCount: 1
      };
      
      mockRedis.get.mockResolvedValue(windowState);
      
      const validations = await Promise.all([
        windowService.validateMessage(userId, 'text'),
        windowService.validateMessage(userId, 'template', 'welcome'),
        windowService.validateMessage(userId, 'media'),
        windowService.validateMessage(userId, 'interactive'),
      ]);
      
      expect(validations).toHaveLength(4);
      validations.forEach(validation => {
        expect(validation.isAllowed).toBe(true);
        expect(validation.requiresTemplate).toBe(false);
      });
    });
  });

  describe('Limpeza e Manutenção', () => {
    it('deve executar limpeza de janelas expiradas', async () => {
      const cleaned = await windowService.cleanupExpiredWindows();
      
      expect(typeof cleaned).toBe('number');
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });

    it('deve obter estatísticas das janelas', async () => {
      const stats = await windowService.getWindowStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.activeWindows).toBe('number');
      expect(typeof stats.totalWindows).toBe('number');
      expect(typeof stats.averageWindowDuration).toBe('number');
    });

    it('deve destruir serviço corretamente', async () => {
      const service = new WindowControlService(mockRedis, customConfig, customOptions);
      
      await expect(service.destroy()).resolves.not.toThrow();
    });
  });

  describe('Configurações Personalizadas', () => {
    it('deve usar configuração customizada de duração', async () => {
      const customDurationConfig = {
        ...customConfig,
        windowDurationMs: 5000 // 5 segundos
      };
      
      const customService = new WindowControlService(mockRedis, customDurationConfig, customOptions);
      
      const windowState = await customService.startWindow('user123');
      
      expect(windowState).toBeDefined();
      expect(windowState.windowEnd.getTime() - windowState.windowStart.getTime()).toBe(5000);
    });

    it('deve usar opções customizadas', async () => {
      const customServiceOptions = {
        ...customOptions,
        autoRenewOnUserMessage: false,
        logActivity: false
      };
      
      const customService = new WindowControlService(mockRedis, customConfig, customServiceOptions);
      
      const windowState: WindowState = {
        userId: 'user123',
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 10000),
        isActive: true,
        lastActivity: new Date(),
        messageCount: 1
      };
      
      mockRedis.get.mockResolvedValue(windowState);
      
      const result = await customService.processUserMessage('user123');
      
      expect(result).toEqual(windowState); // Não deve renovar automaticamente
    });
  });

  describe('Cenários Edge Case', () => {
    it('deve lidar com userId vazio ou inválido', async () => {
      // O serviço não valida userIds, então aceita qualquer valor
      const emptyWindow = await windowService.startWindow('');
      expect(emptyWindow).toBeDefined();
      expect(emptyWindow.userId).toBe('');
      
      const nullWindow = await windowService.startWindow(null as any);
      expect(nullWindow).toBeDefined();
      
      const undefinedWindow = await windowService.startWindow(undefined as any);
      expect(undefinedWindow).toBeDefined();
    });

    it('deve lidar com datas inválidas em WindowState', async () => {
      const invalidWindowState = {
        userId: 'user123',
        windowStart: 'invalid_date' as any,
        windowEnd: new Date(Date.now() + 10000),
        isActive: true,
        lastActivity: new Date(),
        messageCount: 1
      };
      
      mockRedis.get.mockResolvedValue(invalidWindowState);
      
      const state = await windowService.getWindowState('user123');
      
      // O serviço não valida datas, então retorna o estado como está
      expect(state).toEqual(invalidWindowState);
    });

    it('deve lidar com templateId undefined em validação', async () => {
      mockRedis.get.mockResolvedValue(null); // Janela inativa
      
      const validation = await windowService.validateMessage('user123', 'template');
      
      expect(validation.isAllowed).toBe(false);
      expect(validation.requiresTemplate).toBe(true);
    });

    it('deve lidar com tipos de mensagem inválidos', async () => {
      const windowState: WindowState = {
        userId: 'user123',
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 10000),
        isActive: true,
        lastActivity: new Date(),
        messageCount: 1
      };
      
      mockRedis.get.mockResolvedValue(windowState);
      
      // @ts-ignore - Testando comportamento com tipo inválido
      const validation = await windowService.validateMessage('user123', 'invalid_type');
      
      expect(validation.isAllowed).toBe(true); // Com janela ativa, deve permitir
    });
  });
});

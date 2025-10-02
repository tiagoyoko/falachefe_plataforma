import { UAZClient } from '../client';
import { UAZError } from '../errors';
import { SendTextMessageRequest, SendMediaMessageRequest } from '../types';

// Mock do axios
jest.mock('axios');
const mockedAxios = require('axios');

describe('UAZClient', () => {
  let client: UAZClient;
  const mockConfig = {
    baseUrl: 'https://test.uazapi.com',
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    webhookSecret: 'test-webhook-secret',
    timeout: 30000,
  };

  beforeEach(() => {
    client = new UAZClient(mockConfig);
    jest.clearAllMocks();
  });

  describe('sendTextMessage', () => {
    it('should send text message successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'msg-123',
            status: 'sent',
            timestamp: Date.now(),
          },
        },
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      const request: SendTextMessageRequest = {
        number: '5511999999999',
        text: 'Hello, World!',
      };

      const result = await client.sendTextMessage(request);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('msg-123');
    });

    it('should validate phone number', async () => {
      const request: SendTextMessageRequest = {
        number: '123', // Invalid phone number
        text: 'Hello, World!',
      };

      await expect(client.sendTextMessage(request)).rejects.toThrow(UAZError);
    });

    it('should validate message text', async () => {
      const request: SendTextMessageRequest = {
        number: '5511999999999',
        text: '', // Empty text
      };

      await expect(client.sendTextMessage(request)).rejects.toThrow(UAZError);
    });
  });

  describe('sendMediaMessage', () => {
    it('should send media message successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'media-123',
            status: 'sent',
            timestamp: Date.now(),
          },
        },
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      const request: SendMediaMessageRequest = {
        number: '5511999999999',
        media: 'https://example.com/image.jpg',
        type: 'image',
        caption: 'Test image',
      };

      const result = await client.sendMediaMessage(request);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('media-123');
    });

    it('should validate media URL', async () => {
      const request: SendMediaMessageRequest = {
        number: '5511999999999',
        media: 'invalid-url',
        type: 'image',
      };

      await expect(client.sendMediaMessage(request)).rejects.toThrow(UAZError);
    });
  });

  describe('getInstanceStatus', () => {
    it('should get instance status successfully', async () => {
      const mockResponse = {
        data: {
          id: 'instance-123',
          token: 'token-123',
          status: 'connected',
          name: 'Test Instance',
          isBusiness: true,
        },
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      const result = await client.getInstanceStatus();

      expect(result.id).toBe('instance-123');
      expect(result.status).toBe('connected');
    });
  });

  describe('configureWebhook', () => {
    it('should configure webhook successfully', async () => {
      const mockResponse = {
        data: {
          id: 'webhook-123',
          instance_id: 'instance-123',
          enabled: true,
          url: 'https://example.com/webhook',
          events: ['messages'],
        },
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      const webhookConfig = {
        url: 'https://example.com/webhook',
        events: ['messages'],
      };

      const result = await client.configureWebhook(webhookConfig);

      expect(result.id).toBe('webhook-123');
      expect(result.enabled).toBe(true);
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate webhook signature correctly', () => {
      const payload = '{"test": "data"}';
      const signature = 'valid-signature';

      // Mock crypto
      const mockCrypto = {
        createHmac: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue('valid-signature'),
        }),
      };

      jest.doMock('crypto', () => mockCrypto);

      const result = client.validateWebhookSignature(payload, signature);

      expect(result).toBe(true);
    });

    it('should return true when webhook secret is not configured', () => {
      const clientWithoutSecret = new UAZClient({
        ...mockConfig,
        webhookSecret: undefined,
      });

      const result = clientWithoutSecret.validateWebhookSignature('payload', 'signature');

      expect(result).toBe(true);
    });
  });

  describe('processWebhook', () => {
    it('should process webhook payload successfully', async () => {
      const payload = {
        event: 'messages',
        instance: 'instance-123',
        data: {
          id: 'msg-123',
          timestamp: Date.now(),
          from: '5511999999999',
          to: '5511888888888',
          body: 'Hello!',
          type: 'text',
        },
      };

      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await client.processWebhook(payload);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Webhook recebido:',
        expect.objectContaining({
          event: 'messages',
          instance: 'instance-123',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should throw error for invalid webhook payload', async () => {
      const invalidPayload = {
        event: 'messages',
        // Missing instance and data
      };

      await expect(client.processWebhook(invalidPayload as any)).rejects.toThrow(UAZError);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error('Network error')),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      const request: SendTextMessageRequest = {
        number: '5511999999999',
        text: 'Hello, World!',
      };

      await expect(client.sendTextMessage(request)).rejects.toThrow(UAZError);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.name = 'ECONNABORTED';

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(timeoutError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      const request: SendTextMessageRequest = {
        number: '5511999999999',
        text: 'Hello, World!',
      };

      await expect(client.sendTextMessage(request)).rejects.toThrow(UAZError);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        timeout: 60000,
      };

      client.updateConfig(newConfig);

      expect(client.getConfig().timeout).toBe(60000);
    });

    it('should get current configuration', () => {
      const config = client.getConfig();

      expect(config.baseUrl).toBe(mockConfig.baseUrl);
      expect(config.apiKey).toBe(mockConfig.apiKey);
    });
  });
});

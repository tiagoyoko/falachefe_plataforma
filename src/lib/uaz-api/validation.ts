import { z } from 'zod';
import { UAZError } from './errors';

// Schemas de validação para UAZ API
export const SendTextMessageSchema = z.object({
  number: z.string().min(1, 'Número é obrigatório'),
  text: z.string().min(1, 'Texto é obrigatório').max(4096, 'Texto muito longo'),
  delay: z.number().min(0, 'Delay deve ser positivo').max(300, 'Delay máximo 300 segundos').optional(),
  readchat: z.boolean().optional(),
  readmessages: z.boolean().optional(),
  replyid: z.string().optional(),
  mentions: z.array(z.string()).optional(),
  forward: z.boolean().optional(),
  track_source: z.string().optional(),
  track_id: z.string().optional(),
  placeholders: z.record(z.string(), z.any()).optional(),
});

export const SendMediaMessageSchema = z.object({
  number: z.string().min(1, 'Número é obrigatório'),
  media: z.string().min(1, 'Mídia é obrigatória'),
  type: z.enum(['image', 'video', 'audio', 'document']),
  caption: z.string().max(1024, 'Caption muito longo').optional(),
  filename: z.string().optional(),
  delay: z.number().min(0, 'Delay deve ser positivo').max(300, 'Delay máximo 300 segundos').optional(),
  readchat: z.boolean().optional(),
  readmessages: z.boolean().optional(),
  replyid: z.string().optional(),
  forward: z.boolean().optional(),
  track_source: z.string().optional(),
  track_id: z.string().optional(),
  placeholders: z.record(z.string(), z.any()).optional(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  category: z.enum(['marketing', 'utility', 'authentication']),
  language: z.string().length(2, 'Código de idioma deve ter 2 caracteres'),
  content: z.object({
    header: z.object({
      type: z.enum(['text', 'image', 'video', 'document']),
      text: z.string().optional(),
      media: z.string().optional(),
    }).optional(),
    body: z.object({
      text: z.string().min(1, 'Corpo da mensagem é obrigatório'),
    }),
    footer: z.object({
      text: z.string().max(60, 'Rodapé muito longo'),
    }).optional(),
    buttons: z.array(z.object({
      type: z.enum(['url', 'phone_number', 'quick_reply']),
      text: z.string().min(1, 'Texto do botão é obrigatório'),
      url: z.string().url().optional(),
      phone_number: z.string().optional(),
    })).max(3, 'Máximo 3 botões').optional(),
  }),
});

export const WebhookConfigSchema = z.object({
  url: z.string().url('URL do webhook inválida'),
  events: z.array(z.string()).min(1, 'Pelo menos um evento deve ser selecionado'),
  excludeMessages: z.array(z.string()).optional(),
  addUrlEvents: z.boolean().optional(),
  addUrlTypesMessages: z.boolean().optional(),
  action: z.enum(['add', 'update', 'delete']).optional(),
  id: z.string().optional(),
});

// Funções de validação
export function validateSendTextMessage(data: any) {
  try {
    return SendTextMessageSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw UAZError.fromValidation(message);
    }
    throw error;
  }
}

export function validateSendMediaMessage(data: any) {
  try {
    return SendMediaMessageSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw UAZError.fromValidation(message);
    }
    throw error;
  }
}

export function validateCreateTemplate(data: any) {
  try {
    return CreateTemplateSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw UAZError.fromValidation(message);
    }
    throw error;
  }
}

export function validateWebhookConfig(data: any) {
  try {
    return WebhookConfigSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw UAZError.fromValidation(message);
    }
    throw error;
  }
}

// Validação de número de telefone
export function validatePhoneNumber(number: string): boolean {
  // Remove caracteres não numéricos
  const cleanNumber = number.replace(/\D/g, '');
  
  // Verifica se tem pelo menos 10 dígitos (formato mínimo)
  if (cleanNumber.length < 10) return false;
  
  // Verifica se tem no máximo 15 dígitos (padrão internacional)
  if (cleanNumber.length > 15) return false;
  
  return true;
}

// Validação de URL de mídia
export function validateMediaUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Validação de base64
export function validateBase64(data: string): boolean {
  try {
    // Verifica se é base64 válido
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(data)) return false;
    
    // Tenta decodificar
    atob(data);
    return true;
  } catch {
    return false;
  }
}

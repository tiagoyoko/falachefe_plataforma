import { UAZClient } from './client';
import { CreateTemplateRequest, TemplateResponse, UAZError } from './types';
import { UAZError as UAZErrorClass } from './errors';
import { validateCreateTemplate } from './validation';

export interface Template {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paused';
  content: {
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      media?: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    buttons?: Array<{
      type: 'url' | 'phone_number' | 'quick_reply';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  };
  usageCount: number;
  created: string;
  updated: string;
}

export interface TemplateFilters {
  category?: string;
  language?: string;
  status?: string;
  search?: string;
}

export interface CreateTemplateInput {
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  content: {
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      media?: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    buttons?: Array<{
      type: 'url' | 'phone_number' | 'quick_reply';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  };
}

export interface UpdateTemplateInput {
  name?: string;
  content?: {
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      media?: string;
    };
    body?: {
      text: string;
    };
    footer?: {
      text: string;
    };
    buttons?: Array<{
      type: 'url' | 'phone_number' | 'quick_reply';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class TemplateService {
  private uazClient: UAZClient;
  private templateCache: Map<string, Template> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(uazClient: UAZClient) {
    this.uazClient = uazClient;
  }

  /**
   * Criar novo template
   */
  async createTemplate(template: CreateTemplateInput): Promise<Template> {
    try {
      // Validação
      const validatedData = validateCreateTemplate(template);
      
      // Validação adicional de negócio
      const validation = await this.validateTemplate(validatedData);
      if (!validation.isValid) {
        throw UAZErrorClass.fromValidation(validation.errors.join(', '));
      }

      // Criar template via UAZ API
      const response = await this.uazClient.createTemplate(validatedData);
      
      if (!response.success || !response.data) {
        throw UAZErrorClass.fromResponse(response);
      }

      const newTemplate: Template = {
        id: response.data.id,
        name: response.data.name,
        category: response.data.category as any,
        language: response.data.language,
        status: response.data.status as any,
        content: validatedData.content,
        usageCount: 0,
        created: response.data.created,
        updated: response.data.updated,
      };

      // Cache o template
      this.cacheTemplate(newTemplate);

      return newTemplate;
    } catch (error) {
      if (error instanceof UAZErrorClass) throw error;
      throw UAZErrorClass.fromNetworkError(error);
    }
  }

  /**
   * Atualizar template existente
   */
  async updateTemplate(id: string, updates: UpdateTemplateInput): Promise<Template> {
    try {
      // Buscar template atual
      const currentTemplate = await this.getTemplate(id);
      if (!currentTemplate) {
        throw UAZErrorClass.fromNotFound();
      }

      // Validar se pode ser editado
      if (currentTemplate.status === 'approved') {
        throw UAZErrorClass.fromValidation('Templates aprovados não podem ser editados');
      }

      // Mesclar atualizações
      const updatedContent = {
        ...currentTemplate.content,
        ...updates.content,
      };

      const updatedTemplate: CreateTemplateInput = {
        name: updates.name || currentTemplate.name,
        category: currentTemplate.category,
        language: currentTemplate.language,
        content: updatedContent,
      };

      // Validação
      const validation = await this.validateTemplate(updatedTemplate);
      if (!validation.isValid) {
        throw UAZErrorClass.fromValidation(validation.errors.join(', '));
      }

      // TODO: Implementar atualização via UAZ API
      // Por enquanto, simular atualização
      const updated: Template = {
        ...currentTemplate,
        name: updatedTemplate.name,
        content: updatedContent,
        updated: new Date().toISOString(),
      };

      // Atualizar cache
      this.cacheTemplate(updated);

      return updated;
    } catch (error) {
      if (error instanceof UAZErrorClass) throw error;
      throw UAZErrorClass.fromNetworkError(error);
    }
  }

  /**
   * Deletar template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      // Verificar se existe
      const template = await this.getTemplate(id);
      if (!template) {
        throw UAZErrorClass.fromNotFound();
      }

      // Verificar se pode ser deletado
      if (template.status === 'approved' && template.usageCount > 0) {
        throw UAZErrorClass.fromValidation('Templates aprovados em uso não podem ser deletados');
      }

      // TODO: Implementar deleção via UAZ API
      
      // Remover do cache
      this.templateCache.delete(id);
      this.cacheExpiry.delete(id);

    } catch (error) {
      if (error instanceof UAZErrorClass) throw error;
      throw UAZErrorClass.fromNetworkError(error);
    }
  }

  /**
   * Obter template por ID
   */
  async getTemplate(id: string): Promise<Template | null> {
    try {
      // Verificar cache primeiro
      if (this.isTemplateCached(id)) {
        return this.templateCache.get(id) || null;
      }

      // TODO: Buscar via UAZ API
      // Por enquanto, retornar null
      return null;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  /**
   * Listar templates com filtros
   */
  async getTemplates(filters?: TemplateFilters): Promise<Template[]> {
    try {
      // TODO: Implementar busca via UAZ API
      // Por enquanto, retornar templates do cache
      const templates = Array.from(this.templateCache.values());

      // Aplicar filtros
      if (filters) {
        return templates.filter(template => {
          if (filters.category && template.category !== filters.category) return false;
          if (filters.language && template.language !== filters.language) return false;
          if (filters.status && template.status !== filters.status) return false;
          if (filters.search && !template.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
          return true;
        });
      }

      return templates;
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  /**
   * Validar template
   */
  async validateTemplate(template: CreateTemplateInput): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validação de nome
    if (template.name.length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    // Validação de categoria
    if (template.category === 'marketing') {
      warnings.push('Templates de marketing requerem aprovação do WhatsApp');
    }

    // Validação de conteúdo
    if (template.content.body.text.length < 10) {
      errors.push('Corpo da mensagem deve ter pelo menos 10 caracteres');
    }

    if (template.content.body.text.length > 1024) {
      errors.push('Corpo da mensagem muito longo (máximo 1024 caracteres)');
    }

    // Validação de botões
    if (template.content.buttons && template.content.buttons.length > 3) {
      errors.push('Máximo 3 botões permitidos');
    }

    // Validação de footer
    if (template.content.footer && template.content.footer.text.length > 60) {
      errors.push('Rodapé muito longo (máximo 60 caracteres)');
    }

    // Validação de placeholders
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const placeholders = template.content.body.text.match(placeholderRegex) || [];
    if (placeholders.length > 10) {
      warnings.push('Muitos placeholders podem afetar a aprovação');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Obter templates aprovados
   */
  async getApprovedTemplates(): Promise<Template[]> {
    return this.getTemplates({ status: 'approved' });
  }

  /**
   * Obter templates por categoria
   */
  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return this.getTemplates({ category });
  }

  /**
   * Buscar templates por texto
   */
  async searchTemplates(query: string): Promise<Template[]> {
    return this.getTemplates({ search: query });
  }

  /**
   * Cache template
   */
  private cacheTemplate(template: Template): void {
    this.templateCache.set(template.id, template);
    this.cacheExpiry.set(template.id, Date.now() + this.CACHE_TTL);
  }

  /**
   * Verificar se template está em cache
   */
  private isTemplateCached(id: string): boolean {
    const expiry = this.cacheExpiry.get(id);
    if (!expiry || Date.now() > expiry) {
      this.templateCache.delete(id);
      this.cacheExpiry.delete(id);
      return false;
    }
    return this.templateCache.has(id);
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.templateCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Obter estatísticas de templates
   */
  async getTemplateStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    totalUsage: number;
  }> {
    const templates = await this.getTemplates();
    
    const stats = {
      total: templates.length,
      byStatus: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      totalUsage: 0,
    };

    templates.forEach(template => {
      // Por status
      stats.byStatus[template.status] = (stats.byStatus[template.status] || 0) + 1;
      
      // Por categoria
      stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1;
      
      // Uso total
      stats.totalUsage += template.usageCount;
    });

    return stats;
  }
}

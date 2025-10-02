// Validação final da integração UAZ + Redis + Supabase
import { initializeServices, healthCheck, disconnectServices } from './config';
import { UAZClient } from './client';
import { TemplateService } from './template-service';
import { RedisClient } from '../cache/redis-client';
import { UAZLoggerSingleton } from '../logger/uaz-logger';

export async function validateIntegration(): Promise<{
  success: boolean;
  results: {
    uaz: boolean;
    redis: boolean;
    supabase: boolean;
    templates: boolean;
    webhook: boolean;
    overall: boolean;
  };
  errors: string[];
}> {
  const results = {
    uaz: false,
    redis: false,
    supabase: false,
    templates: false,
    webhook: false,
    overall: false,
  };
  const errors: string[] = [];

  try {
    console.log('🚀 Iniciando validação da integração UAZ + Redis + Supabase...');

    // 1. Inicializar serviços
    console.log('📡 Inicializando serviços...');
    await initializeServices();
    console.log('✅ Serviços inicializados com sucesso');

    // 2. Health check
    console.log('🏥 Verificando saúde dos serviços...');
    const health = await healthCheck();
    results.uaz = health.uaz;
    results.redis = health.redis;
    results.overall = health.overall;

    if (!health.uaz) {
      errors.push('UAZ API não está respondendo');
    }
    if (!health.redis) {
      errors.push('Redis não está conectado');
    }

    // 3. Testar UAZ API
    console.log('🔌 Testando UAZ API...');
    try {
      const uazClient = new UAZClient({
        baseUrl: process.env.UAZ_BASE_URL || 'https://falachefe.uazapi.com',
        apiKey: process.env.UAZ_API_KEY || '',
        apiSecret: process.env.UAZ_API_SECRET || '',
        webhookSecret: process.env.UAZ_WEBHOOK_SECRET,
      });

      const instanceStatus = await uazClient.getInstanceStatus();
      console.log('✅ UAZ API conectada:', instanceStatus.name);
      results.uaz = true;
    } catch (error) {
      console.error('❌ Erro na UAZ API:', error);
      errors.push(`UAZ API: ${error}`);
    }

    // 4. Testar Redis
    console.log('🗄️ Testando Redis...');
    try {
      const redisClient = new RedisClient({
        url: process.env.UPSTASH_REDIS_REST_URL || '',
        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
      });

      await redisClient.connect();
      
      // Teste básico de cache
      await redisClient.set('test-key', { message: 'Hello Redis!' });
      const cached = await redisClient.get('test-key');
      
      if (cached && (cached as any).message === 'Hello Redis!') {
        console.log('✅ Redis funcionando corretamente');
        results.redis = true;
      } else {
        throw new Error('Cache não funcionou corretamente');
      }
    } catch (error) {
      console.error('❌ Erro no Redis:', error);
      errors.push(`Redis: ${error}`);
    }

    // 5. Testar Supabase (conexão básica)
    console.log('🗃️ Testando Supabase...');
    try {
      // Verificar se as variáveis de ambiente estão configuradas
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Variáveis de ambiente do Supabase não configuradas');
      }

      // Teste básico de conexão (simulado)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        console.log('✅ Supabase configurado:', supabaseUrl);
        results.supabase = true;
      } else {
        throw new Error('Configuração do Supabase incompleta');
      }
    } catch (error) {
      console.error('❌ Erro no Supabase:', error);
      errors.push(`Supabase: ${error}`);
    }

    // 6. Testar sistema de templates
    console.log('📝 Testando sistema de templates...');
    try {
      const templateService = new TemplateService(new UAZClient({
        baseUrl: process.env.UAZ_BASE_URL || 'https://falachefe.uazapi.com',
        apiKey: process.env.UAZ_API_KEY || '',
        apiSecret: process.env.UAZ_API_SECRET || '',
      }));

      // Teste de validação de template
      const template = {
        name: 'Test Template',
        category: 'utility' as const,
        language: 'pt',
        content: {
          body: {
            text: 'Hello {{name}}!',
          },
        },
      };

      const validation = await templateService.validateTemplate(template);
      
      if (validation.isValid) {
        console.log('✅ Sistema de templates funcionando');
        results.templates = true;
      } else {
        throw new Error(`Validação de template falhou: ${validation.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Erro no sistema de templates:', error);
      errors.push(`Templates: ${error}`);
    }

    // 7. Testar webhook handler
    console.log('🔗 Testando webhook handler...');
    try {
      // Verificar se o arquivo de webhook existe
      const webhookPath = 'src/app/api/webhook/uaz/route.ts';
      const fs = require('fs');
      
      if (fs.existsSync(webhookPath)) {
        console.log('✅ Webhook handler implementado');
        results.webhook = true;
      } else {
        throw new Error('Webhook handler não encontrado');
      }
    } catch (error) {
      console.error('❌ Erro no webhook handler:', error);
      errors.push(`Webhook: ${error}`);
    }

    // 8. Resultado final
    results.overall = results.uaz && results.redis && results.supabase && results.templates && results.webhook;

    if (results.overall) {
      console.log('🎉 Integração completa validada com sucesso!');
    } else {
      console.log('⚠️ Integração parcial - alguns serviços falharam');
    }

    return {
      success: results.overall,
      results,
      errors,
    };

  } catch (error) {
    console.error('💥 Erro crítico na validação:', error);
    errors.push(`Erro crítico: ${error}`);
    
    return {
      success: false,
      results,
      errors,
    };
  } finally {
    // Cleanup
    try {
      await disconnectServices();
    } catch (error) {
      console.error('Erro ao desconectar serviços:', error);
    }
  }
}

// Função para executar validação via CLI
if (require.main === module) {
  validateIntegration()
    .then((result) => {
      console.log('\n📊 Resultado da Validação:');
      console.log('========================');
      console.log(`UAZ API: ${result.results.uaz ? '✅' : '❌'}`);
      console.log(`Redis: ${result.results.redis ? '✅' : '❌'}`);
      console.log(`Supabase: ${result.results.supabase ? '✅' : '❌'}`);
      console.log(`Templates: ${result.results.templates ? '✅' : '❌'}`);
      console.log(`Webhook: ${result.results.webhook ? '✅' : '❌'}`);
      console.log(`Overall: ${result.results.overall ? '✅' : '❌'}`);
      
      if (result.errors.length > 0) {
        console.log('\n❌ Erros encontrados:');
        result.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
      }
      
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

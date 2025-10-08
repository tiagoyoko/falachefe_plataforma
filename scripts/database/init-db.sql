-- Script de inicialização do banco de dados para Chat-Demo-App

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    agent_type VARCHAR(50),
    confidence DECIMAL(3,2),
    processing_time INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agentes
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    version VARCHAR(20),
    capabilities TEXT[],
    config JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de intenções
CREATE TABLE IF NOT EXISTS intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    keywords TEXT[],
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    agent_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contexto de conversa
CREATE TABLE IF NOT EXISTS conversation_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(50),
    current_intent VARCHAR(100),
    conversation_history JSONB,
    user_preferences JSONB,
    session_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de métricas de agentes
CREATE TABLE IF NOT EXISTS agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,4),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_context_conversation_id ON conversation_context(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_context_user_id ON conversation_context(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_created_at ON agent_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_intents_domain ON intents(domain);
CREATE INDEX IF NOT EXISTS idx_intents_agent_type ON intents(agent_type);

-- Índices para busca de texto
CREATE INDEX IF NOT EXISTS idx_messages_content_gin ON messages USING gin(to_tsvector('portuguese', content));
CREATE INDEX IF NOT EXISTS idx_intents_keywords_gin ON intents USING gin(keywords);

-- Inserir agentes padrão
INSERT INTO agents (id, name, type, description, version, capabilities, config) VALUES
('financial-agent-1', 'Financial Agent', 'financial', 'Agente especializado em gestão financeira', '1.0.0', 
 ARRAY['add_expense', 'add_revenue', 'cashflow_analysis', 'budget_planning', 'financial_reporting'],
 '{"model": "gpt-4", "temperature": 0.7, "maxTokens": 2000}'::jsonb),
('name-agent-1', 'Find Name Agent', 'name', 'Agente especializado em busca de nomes', '1.0.0',
 ARRAY['name_search', 'name_validation', 'name_suggestions', 'contact_lookup'],
 '{"model": "gpt-4", "temperature": 0.5, "maxTokens": 1000}'::jsonb),
('auth-agent-1', 'Auth Agent', 'auth', 'Agente especializado em autenticação', '1.0.0',
 ARRAY['user_authentication', 'session_management', 'password_reset', 'account_verification'],
 '{"model": "gpt-4", "temperature": 0.3, "maxTokens": 500}'::jsonb),
('sync-agent-1', 'Sync Agent', 'sync', 'Agente especializado em sincronização', '1.0.0',
 ARRAY['data_synchronization', 'external_api_sync', 'backup_management', 'conflict_resolution'],
 '{"model": "gpt-4", "temperature": 0.6, "maxTokens": 1500}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Inserir intenções padrão
INSERT INTO intents (name, domain, keywords, confidence_threshold, agent_type, priority) VALUES
('add_expense', 'financial', ARRAY['despesa', 'gasto', 'adicionar', 'expense', 'spend'], 0.7, 'financial', 1),
('add_revenue', 'financial', ARRAY['receita', 'renda', 'adicionar', 'revenue', 'income'], 0.7, 'financial', 1),
('cashflow_analysis', 'financial', ARRAY['fluxo', 'caixa', 'análise', 'cashflow', 'analysis'], 0.8, 'financial', 1),
('name_search', 'name', ARRAY['buscar', 'nome', 'encontrar', 'search', 'find', 'name'], 0.7, 'name', 1),
('name_validation', 'name', ARRAY['validar', 'verificar', 'nome', 'validation', 'verify'], 0.8, 'name', 1),
('user_login', 'auth', ARRAY['login', 'entrar', 'acessar', 'signin', 'access'], 0.8, 'auth', 1),
('user_logout', 'auth', ARRAY['logout', 'sair', 'desconectar', 'signout', 'disconnect'], 0.8, 'auth', 1),
('password_reset', 'auth', ARRAY['senha', 'reset', 'recuperar', 'password', 'recover'], 0.9, 'auth', 1),
('sync_data', 'sync', ARRAY['sincronizar', 'sync', 'atualizar', 'update', 'refresh'], 0.7, 'sync', 2),
('backup_data', 'sync', ARRAY['backup', 'cópia', 'segurança', 'security', 'copy'], 0.8, 'sync', 2)
ON CONFLICT (name) DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intents_updated_at BEFORE UPDATE ON intents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversation_context_updated_at BEFORE UPDATE ON conversation_context FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpeza de dados antigos
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Limpar métricas antigas (mais de 30 dias)
    DELETE FROM agent_metrics WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Limpar contexto de conversas antigas (mais de 90 dias)
    DELETE FROM conversation_context 
    WHERE conversation_id IN (
        SELECT id FROM conversations 
        WHERE updated_at < NOW() - INTERVAL '90 days'
    );
    
    -- Limpar mensagens de conversas antigas (mais de 90 dias)
    DELETE FROM messages 
    WHERE conversation_id IN (
        SELECT id FROM conversations 
        WHERE updated_at < NOW() - INTERVAL '90 days'
    );
    
    -- Limpar conversas antigas (mais de 90 dias)
    DELETE FROM conversations 
    WHERE updated_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Criar job para limpeza automática (requer pg_cron)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Usuários do sistema de chat';
COMMENT ON TABLE conversations IS 'Conversas entre usuários e agentes';
COMMENT ON TABLE messages IS 'Mensagens das conversas';
COMMENT ON TABLE agents IS 'Agentes disponíveis no sistema';
COMMENT ON TABLE intents IS 'Intenções reconhecidas pelo sistema';
COMMENT ON TABLE conversation_context IS 'Contexto das conversas';
COMMENT ON TABLE agent_metrics IS 'Métricas de performance dos agentes';


# Sistema de Perfil do Usuário para Agentes

## Visão Geral

O Sistema de Perfil do Usuário permite que os agentes tenham acesso persistente aos dados do perfil do usuário, eliminando a necessidade de repetir informações constantemente. O sistema integra com o sistema de memória existente e fornece uma interface unificada para consulta e atualização de dados do usuário.

## Funcionalidades Principais

### 🧠 Memória Persistente
- **Armazenamento automático**: Informações são extraídas automaticamente das mensagens
- **Contexto personalizado**: Agentes recebem prompts personalizados com dados do usuário
- **Histórico de interações**: Registro de todas as interações para melhor compreensão

### 📊 Dados do Perfil
- **Informações pessoais**: Nome, email, telefone, cargo, empresa
- **Contexto empresarial**: Tipo de negócio, objetivos, prioridades, desafios
- **Preferências**: Estilo de comunicação, idioma, nível de detalhe
- **Histórico de aprendizado**: Experiência, metas, tutoriais completados

### 🔧 Tools para Agentes
- **Consulta de perfil**: Acesso rápido a qualquer informação do usuário
- **Atualização automática**: Dados são atualizados automaticamente durante conversas
- **Prompt personalizado**: Geração automática de prompts contextualizados

## Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Profile  │    │   Memory System  │    │   Agent System  │
│      Tool       │◄──►│                  │◄──►│                 │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Endpoints │    │   Database       │    │  Personalized   │
│                 │    │   Storage        │    │  Responses      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Como Usar

### Para Desenvolvedores

#### 1. Importar a Tool
```typescript
import { userProfileTool } from '@/agents/core/user-profile-tool'
```

#### 2. Consultar Dados do Usuário
```typescript
// Perfil completo
const profile = await userProfileTool.getUserProfile({
  userId: 'user123',
  includeSummary: true
})

// Informações específicas
const personalInfo = await userProfileTool.getPersonalInfo('user123')
const businessContext = await userProfileTool.getBusinessContext('user123')
const preferences = await userProfileTool.getPreferences('user123')
```

#### 3. Atualizar Dados
```typescript
// Atualizar informações pessoais
await userProfileTool.updatePersonalInfo('user123', {
  name: 'João Silva',
  company: 'TechCorp',
  position: 'Gerente'
})

// Atualizar contexto empresarial
await userProfileTool.updateBusinessContext('user123', {
  goals: ['Crescimento', 'Inovação'],
  priorities: ['Vendas', 'Qualidade']
})
```

#### 4. Registrar Interações
```typescript
await userProfileTool.recordInteraction('user123', 'financial_consultation', {
  topic: 'Análise de fluxo de caixa',
  duration: '15 minutos'
})
```

### Para Agentes

#### 1. Geração de Prompt Personalizado
```typescript
const basePrompt = 'Você é um assistente virtual...'
const personalizedPrompt = await userProfileTool.generatePersonalizedPrompt(
  userId, 
  basePrompt
)
```

#### 2. Extração Automática de Informações
```typescript
// As informações são extraídas automaticamente das mensagens
const result = await userProfileTool.extractAndStoreUserInfo(userId, message)
```

## API Endpoints

### Consulta de Perfil
```http
GET /api/user-profile?userId=123&includeSummary=true&fields=personalInfo,businessContext
```

### Atualização de Perfil
```http
POST /api/user-profile
Content-Type: application/json

{
  "userId": "123",
  "action": "updatePersonalInfo",
  "personalInfo": {
    "name": "João Silva",
    "company": "TechCorp"
  }
}
```

### Consulta Rápida
```http
GET /api/user-profile/quick?userId=123&type=personal
GET /api/user-profile/quick?userId=123&type=business
GET /api/user-profile/quick?userId=123&type=summary
```

## Exemplos de Uso

### Cenário 1: Primeira Interação
```typescript
// Usuário: "Olá, meu nome é Maria e trabalho na InovaçãoTech"
// Sistema automaticamente:
// 1. Extrai nome: "Maria"
// 2. Extrai empresa: "InovaçãoTech"
// 3. Armazena no perfil
// 4. Gera prompt personalizado para o agente
```

### Cenário 2: Consulta Posterior
```typescript
// Usuário: "Preciso de ajuda com planejamento financeiro"
// Agente recebe prompt com:
// - Nome: Maria
// - Empresa: InovaçãoTech
// - Contexto empresarial (se disponível)
// - Preferências de comunicação
```

### Cenário 3: Atualização de Contexto
```typescript
// Usuário: "Meus objetivos principais são crescimento e inovação"
// Sistema automaticamente:
// 1. Identifica como contexto empresarial
// 2. Atualiza goals no perfil
// 3. Armazena como memória de alta importância
```

## Benefícios

### Para o Usuário
- ✅ **Não precisa repetir informações**
- ✅ **Respostas mais personalizadas**
- ✅ **Contexto mantido entre conversas**
- ✅ **Experiência mais fluida**

### Para os Agentes
- ✅ **Acesso completo ao contexto do usuário**
- ✅ **Prompts personalizados automaticamente**
- ✅ **Melhor compreensão das necessidades**
- ✅ **Respostas mais relevantes**

### Para o Sistema
- ✅ **Integração com sistema de memória existente**
- ✅ **Escalabilidade e performance**
- ✅ **Facilidade de manutenção**
- ✅ **Extensibilidade para novos dados**

## Configuração

### Variáveis de Ambiente
```env
# Já configurado no sistema existente
DATABASE_URL=...
OPENAI_API_KEY=...
```

### Dependências
- ✅ Sistema de memória existente
- ✅ Banco de dados configurado
- ✅ Agentes implementados

## Testes

Execute o script de teste para validar a integração:

```bash
npx tsx scripts/test-user-profile-system.ts
```

O script testa:
- ✅ Criação e atualização de perfil
- ✅ Consulta de informações específicas
- ✅ Extração automática de dados
- ✅ Geração de prompts personalizados
- ✅ Integração com agentes
- ✅ API endpoints

## Monitoramento

### Logs Importantes
```
🔍 Consultando perfil do usuário: user123
📝 Atualizando perfil do usuário: user123
🧠 Memory and profile context applied
🤖 Prompt personalizado gerado para o agente
```

### Métricas
- Número de perfis criados
- Taxa de atualização de dados
- Uso de prompts personalizados
- Satisfação do usuário

## Roadmap

### Próximas Funcionalidades
- [ ] **Análise de sentimento** das interações
- [ ] **Sugestões proativas** baseadas no perfil
- [ ] **Integração com CRM** externo
- [ ] **Dashboard de perfil** do usuário
- [ ] **Exportação de dados** do perfil

### Melhorias Planejadas
- [ ] **Cache inteligente** para consultas frequentes
- [ ] **Compressão de dados** para otimização
- [ ] **Backup automático** de perfis
- [ ] **Análise de padrões** de uso

## Suporte

Para dúvidas ou problemas:
1. Consulte os logs do sistema
2. Execute os testes de integração
3. Verifique a configuração do banco de dados
4. Confirme as permissões de acesso

---

**Sistema implementado com sucesso!** 🎉

Os agentes agora têm acesso completo aos dados do perfil do usuário e podem fornecer respostas personalizadas sem necessidade de repetir informações.



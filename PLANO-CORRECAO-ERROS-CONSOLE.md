# 🔧 Plano de Correção - Erros do Console

**Data**: 13 de Outubro de 2025  
**Status**: 📋 Plano Detalhado

---

## 📊 Análise dos Problemas

### 1. 🔴 CRÍTICO: Erro 500 no /api/chat

**Erro:**
```
api/chat:1 Failed to load resource: the server responded with a status of 500 ()
❌ Error sending message: Error: Erro ao processar mensagem
```

**Causa Raiz:**
- O endpoint `/api/chat/route.ts` está chamando a API CrewAI no Hetzner
- O servidor pode estar offline ou com problemas
- Conforme `CORRECAO-CHAT-WEB-ERRO-500.md`, o CrewAI estava tentando enviar TODAS as respostas via UAZAPI (WhatsApp), incluindo do chat web

**Impacto:** ⛔ **ALTO** - Chat web completamente quebrado

---

### 2. 🟡 MÉDIO: Rotas 404 (Páginas Inexistentes)

**Erros:**
```
demo?_rsc=pmmii:1  Failed to load resource: 404
agentes?_rsc=pmmii:1  Failed to load resource: 404
templates?_rsc=pmmii:1  Failed to load resource: 404
carreiras?_rsc=pmmii:1  Failed to load resource: 404
privacidade?_rsc=pmmii:1  Failed to load resource: 404
analytics?_rsc=pmmii:1  Failed to load resource: 404
blog?_rsc=pmmii:1  Failed to load resource: 404
termos?_rsc=pmmii:1  Failed to load resource: 404
```

**Causa Raiz:**
Links no **SiteHeader** e **SiteFooter** apontam para rotas que não existem:

**Header (`src/components/site-header.tsx`):**
- Linha 43: `/agentes` → ❌ Não existe (correto: `/dashboard/agents` ou criar página marketing)
- Linha 57: `/templates` → ❌ Não existe
- Linha 104: `/demo` → ❌ Não existe

**Footer (`src/components/site-footer.tsx`):**
- Linha 35: `/agentes` → ❌ Não existe
- Linha 40: `/templates` → ❌ Não existe  
- Linha 45: `/analytics` → ❌ Não existe
- Linha 67: `/blog` → ❌ Não existe
- Linha 72: `/carreiras` → ❌ Não existe
- Linha 104: `/privacidade` → ❌ Não existe
- Linha 107: `/termos` → ❌ Não existe

**Páginas que EXISTEM:**
- ✅ `/dashboard` - Dashboard interno
- ✅ `/dashboard/agents` - Agentes (interno)
- ✅ `/assinantes` - Assinantes
- ✅ `/sobre` - Sobre nós
- ✅ `/precos` - Preços
- ✅ `/solucoes` - Soluções
- ✅ `/contato` - Contato

**Impacto:** ⚠️ **MÉDIO** - UX ruim, links quebrados, erros no console

---

### 3. 🟢 BAIXO: jQuery e screengrabber.js (Extensão do Browser)

**Erros:**
```
jquery-1.3.2.min.js:19 Refused to execute inline script (CSP violation)
screengrabber.js:14 Uncaught TypeError: Cannot set properties of null (setting 'src')
```

**Causa Raiz:**
- **EXTENSÃO DO CHROME** causando os erros
- Extensão ID: `chrome-extension://40e54d60-5c59-401c-bd42-0b619c290e52/`
- jQuery 1.3.2 (2009!) e screengrabber não estão no projeto
- Busca no projeto confirmou: `0 files found` para ambos

**Impacto:** 🟢 **BAIXO** - Não afeta usuários (apenas quem tem a extensão)

---

## ✅ Plano de Ação Detalhado

### 🔴 PRIORIDADE 1: Corrigir Erro 500 no Chat Web

**Objetivo:** Garantir que `/api/chat` funciona corretamente

#### Passo 1.1: Verificar Status do Servidor Hetzner
```bash
# SSH no servidor
ssh root@37.27.248.13

# Verificar se CrewAI está rodando
docker service ls | grep crewai

# Ver logs do serviço
docker service logs falachefe_crewai-api --tail 50 -f

# Testar health check
curl https://api.falachefe.app.br/health
```

**Resultado Esperado:**
- Serviço `falachefe_crewai-api` com estado `RUNNING`
- Health check retorna status 200

---

#### Passo 1.2: Verificar Correção do CrewAI (Web Chat Detection)

**Verificar se correção já foi aplicada:**
```bash
ssh root@37.27.248.13
cd /opt/falachefe-crewai
grep -A 5 "is_web_chat" api_server.py
```

**Se NÃO estiver corrigido, aplicar:**
```python
# Em api_server.py, procurar onde send_to_uazapi é chamado e modificar:

response_text = str(result)

# Detectar se é chat web ou WhatsApp
is_web_chat = phone_number == '+5500000000' or context.get('source') == 'web-chat'

send_result = {
    "success": True,
    "source": "web-chat" if is_web_chat else "whatsapp"
}

# Enviar resposta via UAZAPI apenas para WhatsApp
if not is_web_chat:
    print("📤 Sending response to WhatsApp user...", file=sys.stderr)
    send_result = send_to_uazapi(phone_number, response_text)
else:
    print("💬 Web chat - skipping UAZAPI send", file=sys.stderr)
```

**Deploy da correção:**
```bash
cd /opt/falachefe-crewai
git pull origin master
docker compose restart
```

---

#### Passo 1.3: Testar Endpoint /api/chat

```bash
# Teste local
curl -X POST https://falachefe.app.br/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=SEU_TOKEN" \
  -d '{
    "message": "Olá, teste",
    "userId": "SEU_USER_ID"
  }'
```

**Resultado Esperado:**
```json
{
  "success": true,
  "content": "Resposta do agente...",
  "metadata": {
    "conversationId": "web_...",
    "source": "web-chat"
  }
}
```

---

### 🟡 PRIORIDADE 2: Corrigir Links Quebrados (404s)

**Objetivo:** Eliminar todos os erros 404 do console

#### Opção A: Criar Páginas Faltantes (Recomendado)

Criar páginas de marketing/institucional que estão faltando:

```bash
# Criar estrutura de pastas
mkdir -p src/app/{demo,agentes,templates,analytics,carreiras,privacidade,blog,termos}

# Criar páginas básicas
touch src/app/demo/page.tsx
touch src/app/agentes/page.tsx  # Página marketing (diferente de /dashboard/agents)
touch src/app/templates/page.tsx
touch src/app/analytics/page.tsx
touch src/app/carreiras/page.tsx
touch src/app/privacidade/page.tsx
touch src/app/blog/page.tsx
touch src/app/termos/page.tsx
```

**Template de Página:**
```tsx
// src/app/[rota]/page.tsx
import { MessageSquare } from "lucide-react"

export default function PaginaNome() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <MessageSquare className="h-16 w-16 mx-auto mb-6 text-primary" />
        <h1 className="text-4xl font-bold mb-4">
          [Título da Página]
        </h1>
        <p className="text-xl text-muted-foreground">
          Em construção. Em breve mais informações.
        </p>
      </div>
    </div>
  )
}
```

---

#### Opção B: Corrigir Links (Temporário)

Se não houver tempo para criar páginas, corrigir links para rotas existentes:

**Header (src/components/site-header.tsx):**
```tsx
// Linha 43: Mudar de /agentes para /dashboard/agents (se logado) ou remover
{session?.user ? (
  <Link href="/dashboard/agents" ...>
    Agentes
  </Link>
) : null}

// Linha 57: Remover link /templates se não existir
// Linha 104: Remover botão "Ver Demo" ou mudar para /chat
```

**Footer (src/components/site-footer.tsx):**
```tsx
// Remover links inexistentes ou mudar para #:
<Link href="#" className="...">
  [Nome] (em breve)
</Link>
```

---

### 🟢 PRIORIDADE 3: Ignorar Erros de Extensão (Opcional)

**Objetivo:** Apenas documentar que erros de jQuery/screengrabber são de extensão

Adicionar comentário no README ou docs:

```markdown
## ⚠️ Erros Conhecidos (Não Críticos)

### Extensões do Browser

Se você ver erros de `jquery-1.3.2.min.js` ou `screengrabber.js` no console,
são causados por extensões do Chrome/Firefox instaladas no seu browser.

**Solução:** Ignorar ou desabilitar extensões durante desenvolvimento.

Estes erros NÃO afetam o funcionamento da aplicação.
```

---

## 📋 Checklist de Execução

### Fase 1: Correção Crítica (Chat Web)

- [ ] **1.1** SSH no Hetzner e verificar status CrewAI
- [ ] **1.2** Verificar/aplicar correção de detecção web chat
- [ ] **1.3** Restart do Docker Compose se necessário
- [ ] **1.4** Testar `/api/chat` via curl
- [ ] **1.5** Testar chat web no browser (https://falachefe.app.br/chat)
- [ ] **1.6** Confirmar que NÃO há mais erro 500

### Fase 2: Correção de Links

- [ ] **2.1** Decidir: Criar páginas ou corrigir links?
  - [ ] Opção A: Criar 8 páginas faltantes
  - [ ] Opção B: Ajustar links no Header/Footer
- [ ] **2.2** Implementar correção escolhida
- [ ] **2.3** Commit e push para GitHub (usando GitHub MCP)
- [ ] **2.4** Aguardar deploy Vercel (2-4 min)
- [ ] **2.5** Verificar deploy via Vercel MCP
- [ ] **2.6** Testar no browser: NÃO deve haver 404s

### Fase 3: Documentação

- [ ] **3.1** Adicionar nota sobre extensões do browser no README
- [ ] **3.2** Atualizar este documento com resultados
- [ ] **3.3** Commit final da documentação

---

## 🧪 Testes de Validação

### Teste 1: Chat Web Funcional
```bash
# Acessar
https://falachefe.app.br/chat

# Fazer login
# Enviar mensagem: "oi"
# Verificar resposta aparece

# Console NÃO deve mostrar erro 500
```

### Teste 2: Navegação Sem Erros
```bash
# Abrir DevTools (F12)
# Acessar: https://falachefe.app.br
# Clicar em todos os links do Header e Footer
# Console NÃO deve mostrar erros 404
```

### Teste 3: Logs do Servidor
```bash
ssh root@37.27.248.13
docker service logs falachefe_crewai-api --tail 20

# Deve mostrar:
# ✅ "💬 Web chat - skipping UAZAPI send" (para chat web)
# ✅ "📤 Sending response to WhatsApp..." (para WhatsApp)
```

---

## 📈 Resultados Esperados

### Antes da Correção
- ❌ Chat web com erro 500
- ❌ 8 rotas retornando 404
- ❌ Console poluído com erros
- ❌ UX ruim (links quebrados)

### Depois da Correção
- ✅ Chat web funcionando 100%
- ✅ Todas as rotas funcionais OU links corrigidos
- ✅ Console limpo (exceto extensões)
- ✅ UX profissional

---

## 🔗 Documentos Relacionados

- `CORRECAO-CHAT-WEB-ERRO-500.md` - Correção do erro 500 original
- `ARQUITETURA-DOMINIOS.md` - Arquitetura Vercel + Hetzner
- `DEPLOY-HETZNER-SUCCESS.md` - Deploy do servidor CrewAI
- `README-CHAT-WEB-CREWAI.md` - Documentação do chat web

---

## 📝 Notas Técnicas

### Por que os erros de jQuery não são do projeto?

1. Busca `grep -r "jquery" src/` → Nenhum resultado
2. Busca `glob "**/*jquery*.js"` → 0 arquivos
3. Busca `glob "**/screengrabber.js"` → 0 arquivos
4. Extension ID no erro: `chrome-extension://40e54d60-5c59-401c-bd42-0b619c290e52/`

**Conclusão:** Scripts injetados por extensão do browser, não fazem parte do projeto.

### Arquitetura de Deploy

**Vercel (falachefe.app.br):**
- Frontend Next.js
- Backend API Routes
- Better Auth + Google OAuth
- Supabase PostgreSQL

**Hetzner (api.falachefe.app.br):**
- Docker Swarm
- CrewAI Flask API
- Traefik Proxy
- Python Agents (LEO, LIA, MAX)

**Fluxo Chat Web:**
```
Browser → /api/chat → api.falachefe.app.br/process → CrewAI → JSON Response → Browser
```

---

**Status:** 📋 Plano Completo - Pronto para Execução  
**Tempo Estimado:** 1-2 horas  
**Complexidade:** Média


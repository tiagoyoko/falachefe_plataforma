# 🎯 MESSAGE ROUTER - Sistema de Roteamento Inteligente

## 📋 VISÃO GERAL

O **Message Router** analisa cada mensagem recebida do WhatsApp e **roteia automaticamente** para o processador adequado baseado no **tipo de conteúdo**.

---

## 🔍 TIPOS DE MENSAGEM SUPORTADOS

### 📝 Apenas Texto
```typescript
MessageContentType.TEXT_ONLY
```
**Exemplos:**
- "Olá, preciso de ajuda"
- "Como funciona o serviço?"
- "Quero saber sobre preços"

**Destino:** `CREWAI_TEXT` → `/process`  
**Tempo:** ~30 segundos  
**Prioridade:** ALTA

---

### 🖼️ Texto + Imagem
```typescript
MessageContentType.TEXT_WITH_IMAGE
```
**Exemplos:**
- [Foto de produto] + "O que acha deste design?"
- [Screenshot] + "Preciso de ajuda com este erro"

**Destino:** `CREWAI_MEDIA` → `/process/media`  
**Tempo:** ~60 segundos  
**Prioridade:** MÉDIA

---

### 🎤 Texto + Áudio
```typescript
MessageContentType.TEXT_WITH_AUDIO
```
**Exemplos:**
- [Áudio] + "Segue minha apresentação"
- [PTT] + "Ouça esta mensagem"

**Destino:** `CREWAI_AUDIO` → `/process/audio`  
**Tempo:** ~120 segundos (transcrição)  
**Prioridade:** MÉDIA

---

### 📄 Texto + Documento
```typescript
MessageContentType.TEXT_WITH_DOCUMENT
```
**Exemplos:**
- [PDF] + "Analise este contrato"
- [XLSX] + "Revise esta planilha"

**Destino:** `CREWAI_DOCUMENT` → `/process/document`  
**Tempo:** ~90 segundos  
**Prioridade:** MÉDIA

---

### 🖼️ Apenas Mídia (sem texto)

#### Imagem
```typescript
MessageContentType.IMAGE_ONLY
```
**Destino:** `CREWAI_MEDIA` → `/process/media`  
**Ação:** Análise visual + geração de resposta contextual

#### Áudio
```typescript
MessageContentType.AUDIO_ONLY
```
**Destino:** `CREWAI_AUDIO` → `/process/audio`  
**Ação:** Transcrição automática + análise

#### Vídeo
```typescript
MessageContentType.VIDEO_ONLY
```
**Destino:** `CREWAI_MEDIA` → `/process/media`  
**Ação:** Análise de frames + geração de resumo

#### Documento
```typescript
MessageContentType.DOCUMENT_ONLY
```
**Destino:** `CREWAI_DOCUMENT` → `/process/document`  
**Ação:** Extração de texto + análise

---

### 🔘 Interações

#### Botões
```typescript
MessageContentType.BUTTON_RESPONSE
```
**Destino:** `AUTO_REPLY`  
**Ação:** Resposta automática baseada no botão clicado

#### Listas
```typescript
MessageContentType.LIST_RESPONSE
```
**Destino:** `AUTO_REPLY`  
**Ação:** Processamento da opção selecionada

---

### 🚫 Tipos Ignorados

```typescript
MessageContentType.STICKER      // Figurinhas
MessageContentType.LOCATION     // Localização
MessageContentType.CONTACT      // Contatos
MessageContentType.POLL         // Enquetes
```
**Destino:** `IGNORE`  
**Ação:** Não processa (apenas salva no banco)

---

## 🔄 FLUXO DE ROTEAMENTO

```
1. Mensagem chega no webhook
   ↓
2. Decodificar base64 (se necessário)
   ↓
3. MessageClassifier.classify(message)
   ├── Analisa messageType
   ├── Analisa mediaType  
   ├── Verifica se tem texto
   ├── Verifica se tem mídia
   └── Retorna classification
   ↓
4. MessageRouter.route(message, chat, baseUrl)
   ├── Usa classification
   ├── Determina destino
   ├── Define prioridade
   ├── Estima tempo de processamento
   └── Retorna routing config
   ↓
5. Decisão de processamento
   ├── shouldProcess? SIM → Continua
   └── shouldProcess? NÃO → Ignora
   ↓
6. Preparar payload específico
   MessageRouter.preparePayload()
   ├── TEXT → payload básico
   ├── MEDIA → adiciona media.url
   ├── AUDIO → adiciona audio.url + transcription flag
   └── DOCUMENT → adiciona document.url + extractText flag
   ↓
7. Enfileirar no QStash
   qstash.publishMessage(targetEndpoint, payload)
   ↓
8. Processamento assíncrono
   CrewAI processa → Envia resposta
```

---

## 📊 MATRIZ DE ROTEAMENTO

| Tipo Mensagem | Destino | Endpoint | Tempo | Prioridade |
|---------------|---------|----------|-------|------------|
| **Texto puro** | CrewAI Text | `/process` | 30s | Alta |
| **Texto + Imagem** | CrewAI Media | `/process/media` | 60s | Média |
| **Texto + Áudio** | CrewAI Audio | `/process/audio` | 120s | Média |
| **Texto + Vídeo** | CrewAI Media | `/process/media` | 180s | Média |
| **Texto + Documento** | CrewAI Document | `/process/document` | 90s | Média |
| **Imagem** | CrewAI Media | `/process/media` | 60s | Baixa |
| **Áudio** | CrewAI Audio | `/process/audio` | 120s | Baixa |
| **Vídeo** | CrewAI Media | `/process/media` | 180s | Baixa |
| **Documento** | CrewAI Document | `/process/document` | 90s | Baixa |
| **Botão/Lista** | Auto Reply | N/A | 5s | Alta |
| **Sticker/Localização** | Ignore | N/A | 0s | N/A |

---

## 💻 USO NO CÓDIGO

### Exemplo 1: Classificar Mensagem
```typescript
import { MessageClassifier } from '@/lib/message-router';

const classification = MessageClassifier.classify(message);

console.log(classification);
// {
//   contentType: 'text_with_image',
//   destination: 'crewai_media',
//   hasText: true,
//   hasMedia: true,
//   mediaType: 'image/jpeg',
//   textContent: 'Analise esta imagem',
//   priority: 'medium',
//   metadata: {
//     messageType: 'ImageMessage',
//     hasCaption: true,
//     estimatedProcessingTime: 60
//   }
// }
```

### Exemplo 2: Rotear Mensagem
```typescript
import { MessageRouter } from '@/lib/message-router';

const routing = await MessageRouter.route(message, chat, baseUrl);

if (routing.shouldProcess) {
  const payload = MessageRouter.preparePayload(
    message, 
    chat, 
    routing.classification, 
    userId, 
    conversationId
  );
  
  // Enviar para endpoint apropriado
  await qstash.publishMessage(routing.destination.endpoint, payload);
}
```

---

## 🎯 ENDPOINTS DA API CREWAI

### 1. `/process` (Texto)
**Para:** Mensagens de texto puro  
**Agentes:** Orchestrator → Especialistas  
**Tempo:** 30s

### 2. `/process/media` (Imagem/Vídeo)
**Para:** Análise visual  
**Recursos:** GPT-4 Vision  
**Tempo:** 60-180s  
**Futuro:** OCR, object detection

### 3. `/process/audio` (Áudio)
**Para:** Transcrição + análise  
**Recursos:** Whisper API  
**Tempo:** 120s  
**Futuro:** Análise de sentimento

### 4. `/process/document` (Documentos)
**Para:** PDFs, Word, Excel  
**Recursos:** Text extraction  
**Tempo:** 90s  
**Futuro:** Análise de contratos, planilhas

---

## 🔧 CONFIGURAÇÃO

### Variáveis de Ambiente
```bash
# URL base da API CrewAI
CREWAI_API_URL=https://falachefe.app.br

# ou (legacy)
RAILWAY_WORKER_URL=https://falachefe.app.br
```

### Timeouts por Tipo
```typescript
// Definido em router.ts
const destinations = {
  CREWAI_TEXT: { timeout: 180000 },      // 3min
  CREWAI_MEDIA: { timeout: 300000 },     // 5min
  CREWAI_AUDIO: { timeout: 240000 },     // 4min
  CREWAI_DOCUMENT: { timeout: 180000 },  // 3min
  AUTO_REPLY: { timeout: 5000 }          // 5s
};
```

---

## 🧪 COMO TESTAR

### Teste 1: Texto Puro
```bash
# Enviar WhatsApp para +55 11 99234-5329:
"Olá, preciso de ajuda"

# Esperado:
# - Classificação: TEXT_ONLY
# - Destino: CREWAI_TEXT → /process
# - Tempo: ~30s
# - Resposta do CrewAI
```

### Teste 2: Imagem com Legenda
```bash
# Enviar foto + texto:
[Foto de produto] "O que acha?"

# Esperado:
# - Classificação: TEXT_WITH_IMAGE
# - Destino: CREWAI_MEDIA → /process/media
# - Tempo: ~60s
# - Análise visual + resposta
```

### Teste 3: Áudio
```bash
# Enviar áudio de voz

# Esperado:
# - Classificação: AUDIO_ONLY
# - Destino: CREWAI_AUDIO → /process/audio
# - Tempo: ~120s
# - Transcrição + resposta baseada no áudio
```

### Teste 4: Documento
```bash
# Enviar PDF + "Analise este contrato"

# Esperado:
# - Classificação: TEXT_WITH_DOCUMENT
# - Destino: CREWAI_DOCUMENT → /process/document
# - Tempo: ~90s
# - Extração de texto + análise jurídica
```

---

## 📊 LOGS DE EXEMPLO

### Mensagem de Texto
```
📍 Message Routing: {
  type: 'text_only',
  destination: 'crewai_text',
  shouldProcess: true,
  priority: 'high',
  estimatedTime: '30s'
}
🎯 Target: https://falachefe.app.br/process (CrewAI - Análise de texto completa)
✅ Message queued successfully
```

### Mensagem com Imagem
```
📍 Message Routing: {
  type: 'text_with_image',
  destination: 'crewai_media',
  shouldProcess: true,
  priority: 'medium',
  estimatedTime: '60s'
}
🎯 Target: https://falachefe.app.br/process/media (CrewAI - Análise de mídia)
✅ Message queued with media: { url: '...', type: 'image/jpeg' }
```

### Sticker (Ignorado)
```
📍 Message Routing: {
  type: 'sticker',
  destination: 'ignore',
  shouldProcess: false
}
⏭️ Skipping message: Tipo de mensagem ignorado: sticker
```

---

## 🚀 PRÓXIMAS IMPLEMENTAÇÕES

### Fase 1 (Atual) ✅
- [x] Classificação de tipos de mensagem
- [x] Roteamento para endpoints diferentes
- [x] Priorização de processamento
- [x] Suporte a base64

### Fase 2 (Próximo)
- [ ] Implementar `/process/media` na API CrewAI
- [ ] Implementar `/process/audio` com Whisper
- [ ] Implementar `/process/document` com OCR

### Fase 3 (Futuro)
- [ ] Análise de sentimento
- [ ] Detecção de spam
- [ ] Categorização automática
- [ ] Machine learning para classificação

---

## 📚 ARQUIVOS CRIADOS

```
src/lib/message-router/
├── types.ts           # Enums e interfaces
├── classifier.ts      # Classificação de mensagens
├── router.ts          # Roteamento para destinos
└── index.ts           # Exports
```

---

## ✅ BENEFÍCIOS

1. **Escalabilidade**: Fácil adicionar novos tipos
2. **Manutenibilidade**: Lógica centralizada
3. **Performance**: Priorização automática
4. **Observabilidade**: Logs detalhados
5. **Flexibilidade**: Destinos configuráveis

---

**🎉 Sistema de roteamento implementado e pronto para uso!**


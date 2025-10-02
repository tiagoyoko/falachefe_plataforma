# Epic 1: Integração WhatsApp UAZ API

## Visão Geral

Implementar a integração completa com a UAZ API para WhatsApp Business Platform, incluindo autenticação, gerenciamento de webhooks, envio e recebimento de mensagens, e controle de templates.

## Objetivo

Estabelecer a base de comunicação da plataforma com WhatsApp, garantindo conformidade com as políticas da plataforma e suporte a todos os tipos de mensagem necessários.

## Critérios de Aceitação

### Funcionalidades Principais
- ✅ **Autenticação UAZ API**: Configuração e gerenciamento de tokens de acesso
- ✅ **Webhook Management**: Recebimento e processamento de mensagens do WhatsApp
- ✅ **Envio de Mensagens**: Suporte a texto, mídia, listas interativas e flows
- ✅ **Templates Management**: Criação, edição e gerenciamento de templates via UAZ API
- ✅ **Controle de Janela 24h**: Implementação da política de janela de atendimento
- ✅ **Opt-in/Opt-out**: Gerenciamento de consentimento dos usuários

### Requisitos Técnicos
- ✅ **Rate Limiting**: Respeitar limites da UAZ API
- ✅ **Error Handling**: Tratamento robusto de erros da API
- ✅ **Logging**: Registro detalhado de todas as interações
- ✅ **Retry Logic**: Mecanismo de retry para falhas temporárias
- ✅ **Webhook Security**: Validação de assinatura dos webhooks

## Histórias de Usuário

### 1.1 Configuração Inicial da UAZ API
**Como** administrador da plataforma  
**Quero** configurar a integração com UAZ API  
**Para que** a plataforma possa se comunicar com WhatsApp

**Critérios de Aceitação:**
- Configurar credenciais da UAZ API
- Validar conectividade com a API
- Configurar webhook para recebimento de mensagens
- Testar envio de mensagem de verificação

### 1.2 Recebimento de Mensagens
**Como** sistema da plataforma  
**Quero** receber mensagens do WhatsApp via webhook  
**Para que** possa processar solicitações dos usuários

**Critérios de Aceitação:**
- Receber webhooks da UAZ API
- Validar assinatura dos webhooks
- Extrair dados da mensagem (texto, mídia, metadados)
- Encaminhar para o orquestrador

### 1.3 Envio de Mensagens
**Como** agente da plataforma  
**Quero** enviar mensagens via WhatsApp  
**Para que** possa responder aos usuários

**Critérios de Aceitação:**
- Enviar mensagens de texto
- Enviar mídia (imagens, PDFs, documentos)
- Enviar mensagens interativas (listas, botões, flows)
- Respeitar limites de rate limiting

### 1.4 Gerenciamento de Templates
**Como** administrador  
**Quero** gerenciar templates de mensagem  
**Para que** possa enviar notificações fora da janela de 24h

**Critérios de Aceitação:**
- Criar templates de texto, mídia e interativos
- Submeter templates para aprovação via UAZ API
- Acompanhar status de aprovação
- Categorizar templates (marketing, utilidade, autenticação)

### 1.5 Controle de Janela de Atendimento
**Como** sistema da plataforma  
**Quero** controlar a janela de 24h de atendimento  
**Para que** respeite as políticas do WhatsApp

**Critérios de Aceitação:**
- Iniciar janela de 24h quando usuário envia mensagem
- Permitir qualquer tipo de mensagem dentro da janela
- Restringir a templates aprovados fora da janela
- Renovar janela quando usuário responde

## Definição de Pronto

- [ ] Integração com UAZ API configurada e testada
- [ ] Webhook funcionando e validando assinaturas
- [ ] Envio de todos os tipos de mensagem implementado
- [ ] Gerenciamento de templates operacional
- [ ] Controle de janela de 24h implementado
- [ ] Testes unitários e de integração passando
- [ ] Documentação técnica atualizada
- [ ] Deploy em ambiente de desenvolvimento

## Estimativa

**3 semanas**

## Dependências

- Configuração de ambiente de desenvolvimento
- Credenciais da UAZ API
- Configuração de webhook no WhatsApp Business

## Riscos

- **Alto**: Limitações ou mudanças na UAZ API
- **Médio**: Complexidade do controle de janela de 24h
- **Baixo**: Rate limiting da API

## Notas Técnicas

- Usar SDK oficial da UAZ API quando disponível
- Implementar cache para templates aprovados
- Configurar monitoramento de webhook health
- Implementar fallback para falhas de API


# Epic 1: Integração WhatsApp UAZ API - Histórias de Usuário

## Visão Geral

Histórias de usuário para implementar a integração completa com a UAZ API para WhatsApp Business Platform.

## Histórias de Usuário

### 1.1 Configuração Inicial da UAZ API

**Como** administrador da plataforma  
**Quero** configurar a integração com UAZ API  
**Para que** a plataforma possa se comunicar com WhatsApp

#### Critérios de Aceitação
- [ ] Configurar credenciais da UAZ API (API Key, Secret)
- [ ] Validar conectividade com a API através de endpoint de health check
- [ ] Configurar webhook para recebimento de mensagens
- [ ] Testar envio de mensagem de verificação
- [ ] Armazenar credenciais de forma segura (criptografadas)
- [ ] Implementar rotação automática de tokens quando necessário

#### Definição de Pronto
- [ ] Configuração de ambiente para UAZ API
- [ ] Validação de conectividade implementada
- [ ] Webhook configurado e testado
- [ ] Testes unitários para autenticação
- [ ] Documentação de configuração criada
- [ ] Deploy em ambiente de desenvolvimento

#### Estimativa
**5 Story Points**

#### Dependências
- Configuração de ambiente de desenvolvimento
- Credenciais da UAZ API
- Configuração de webhook no WhatsApp Business

#### Notas Técnicas
- Usar variáveis de ambiente para credenciais
- Implementar retry logic para falhas de conectividade
- Configurar timeout adequado para requests
- Implementar logging detalhado para debug

---

### 1.2 Recebimento de Mensagens via Webhook

**Como** sistema da plataforma  
**Quero** receber mensagens do WhatsApp via webhook  
**Para que** possa processar solicitações dos usuários

#### Critérios de Aceitação
- [ ] Receber webhooks da UAZ API em endpoint dedicado
- [ ] Validar assinatura dos webhooks para segurança
- [ ] Extrair dados da mensagem (texto, mídia, metadados, usuário)
- [ ] Processar diferentes tipos de mensagem (texto, imagem, documento, áudio)
- [ ] Encaminhar mensagem processada para o orquestrador
- [ ] Implementar retry logic para falhas de processamento
- [ ] Registrar todas as mensagens recebidas para auditoria

#### Definição de Pronto
- [ ] Endpoint de webhook implementado
- [ ] Validação de assinatura funcionando
- [ ] Parser de mensagens implementado
- [ ] Integração com orquestrador funcionando
- [ ] Testes de integração passando
- [ ] Logging de auditoria implementado

#### Estimativa
**8 Story Points**

#### Dependências
- História 1.1 (Configuração Inicial)
- Definição do formato de dados para orquestrador

#### Notas Técnicas
- Usar middleware para validação de webhook
- Implementar rate limiting para evitar spam
- Configurar timeout para processamento
- Usar filas para processamento assíncrono

---

### 1.3 Envio de Mensagens de Texto

**Como** agente da plataforma  
**Quero** enviar mensagens de texto via WhatsApp  
**Para que** possa responder aos usuários

#### Critérios de Aceitação
- [ ] Enviar mensagens de texto simples
- [ ] Enviar mensagens com formatação (negrito, itálico, código)
- [ ] Suportar emojis e caracteres especiais
- [ ] Implementar rate limiting respeitando limites da UAZ API
- [ ] Tratar erros de envio (usuário bloqueado, número inválido, etc.)
- [ ] Implementar retry automático para falhas temporárias
- [ ] Registrar status de entrega das mensagens

#### Definição de Pronto
- [ ] Serviço de envio de mensagens implementado
- [ ] Suporte a formatação funcionando
- [ ] Rate limiting implementado
- [ ] Tratamento de erros funcionando
- [ ] Retry logic implementado
- [ ] Testes unitários e de integração passando

#### Estimativa
**5 Story Points**

#### Dependências
- História 1.1 (Configuração Inicial)
- Definição de interface para agentes

#### Notas Técnicas
- Usar SDK oficial da UAZ API quando disponível
- Implementar cache para rate limiting
- Configurar timeout adequado para envios
- Implementar circuit breaker para falhas recorrentes

---

### 1.4 Envio de Mídia (Imagens, PDFs, Documentos)

**Como** agente da plataforma  
**Quero** enviar arquivos de mídia via WhatsApp  
**Para que** possa compartilhar documentos e imagens com usuários

#### Critérios de Aceitação
- [ ] Enviar imagens (JPG, PNG, GIF)
- [ ] Enviar documentos (PDF, DOC, XLS)
- [ ] Enviar áudios (MP3, WAV, OGG)
- [ ] Enviar vídeos (MP4, AVI, MOV)
- [ ] Validar tamanho e formato dos arquivos
- [ ] Implementar upload para storage temporário
- [ ] Gerar URLs temporárias para mídia
- [ ] Limpar arquivos temporários após envio

#### Definição de Pronto
- [ ] Suporte a todos os tipos de mídia implementado
- [ ] Validação de arquivos funcionando
- [ ] Upload para storage implementado
- [ ] Geração de URLs temporárias funcionando
- [ ] Limpeza automática de arquivos implementada
- [ ] Testes com diferentes tipos de arquivo passando

#### Estimativa
**8 Story Points**

#### Dependências
- História 1.3 (Envio de Mensagens de Texto)
- Configuração de storage para arquivos

#### Notas Técnicas
- Usar storage temporário (S3, Cloudinary)
- Implementar compressão de imagens
- Configurar TTL para URLs temporárias
- Implementar validação de vírus para uploads

---

### 1.5 Envio de Mensagens Interativas (Listas, Botões, Flows)

**Como** agente da plataforma  
**Quero** enviar mensagens interativas via WhatsApp  
**Para que** possa oferecer opções e formulários aos usuários

#### Critérios de Aceitação
- [ ] Enviar listas de opções com até 10 itens
- [ ] Enviar botões de resposta rápida (até 3 botões)
- [ ] Enviar flows interativos para formulários complexos
- [ ] Processar respostas de mensagens interativas
- [ ] Validar formato das mensagens interativas
- [ ] Implementar fallback para mensagens não suportadas
- [ ] Manter estado das interações do usuário

#### Definição de Pronto
- [ ] Suporte a listas implementado
- [ ] Suporte a botões implementado
- [ ] Suporte a flows implementado
- [ ] Processamento de respostas funcionando
- [ ] Validação de formato implementada
- [ ] Fallback funcionando
- [ ] Testes de interação passando

#### Estimativa
**10 Story Points**

#### Dependências
- História 1.3 (Envio de Mensagens de Texto)
- Definição de formatos de mensagens interativas

#### Notas Técnicas
- Usar templates da UAZ API para mensagens interativas
- Implementar validação de JSON para flows
- Configurar timeout para respostas interativas
- Implementar cache para estado de interações

---

### 1.6 Gerenciamento de Templates de Mensagem

**Como** administrador  
**Quero** gerenciar templates de mensagem via UAZ API  
**Para que** possa enviar notificações fora da janela de 24h

#### Critérios de Aceitação
- [ ] Criar templates de texto, mídia e interativos
- [ ] Editar templates existentes
- [ ] Submeter templates para aprovação via UAZ API
- [ ] Acompanhar status de aprovação dos templates
- [ ] Categorizar templates (marketing, utilidade, autenticação)
- [ ] Ativar/desativar templates
- [ ] Visualizar histórico de mudanças nos templates

#### Definição de Pronto
- [ ] CRUD de templates implementado
- [ ] Integração com UAZ API para aprovação funcionando
- [ ] Acompanhamento de status implementado
- [ ] Categorização funcionando
- [ ] Histórico de mudanças implementado
- [ ] Interface administrativa para templates funcionando
- [ ] Testes de integração com UAZ API passando

#### Estimativa
**8 Story Points**

#### Dependências
- História 1.1 (Configuração Inicial)
- Interface administrativa básica

#### Notas Técnicas
- Implementar cache para templates aprovados
- Configurar webhook para notificações de status
- Implementar validação de templates antes do envio
- Usar filas para processamento assíncrono de aprovação

---

### 1.7 Controle de Janela de Atendimento de 24h

**Como** sistema da plataforma  
**Quero** controlar a janela de 24h de atendimento  
**Para que** respeite as políticas do WhatsApp

#### Critérios de Aceitação
- [ ] Iniciar janela de 24h quando usuário envia mensagem
- [ ] Permitir qualquer tipo de mensagem dentro da janela
- [ ] Restringir a templates aprovados fora da janela
- [ ] Renovar janela quando usuário responde
- [ ] Implementar notificações de expiração da janela
- [ ] Manter histórico de janelas por usuário
- [ ] Configurar exceções para tipos de template específicos

#### Definição de Pronto
- [ ] Controle de janela implementado
- [ ] Validação de tipo de mensagem funcionando
- [ ] Renovação automática de janela funcionando
- [ ] Notificações de expiração implementadas
- [ ] Histórico de janelas funcionando
- [ ] Configuração de exceções implementada
- [ ] Testes de cenários de janela passando

#### Estimativa
**6 Story Points**

#### Dependências
- História 1.6 (Gerenciamento de Templates)
- Sistema de notificações

#### Notas Técnicas
- Usar Redis para controle de janelas em tempo real
- Implementar TTL automático para janelas
- Configurar monitoramento de janelas expiradas
- Implementar alertas para violações de política

---

### 1.8 Gerenciamento de Opt-in/Opt-out

**Como** sistema da plataforma  
**Quiero** gerenciar consentimento dos usuários  
**Para que** respeite as políticas de privacidade e LGPD

#### Critérios de Aceitação
- [ ] Registrar opt-in dos usuários
- [ ] Processar opt-out imediatamente
- [ ] Validar opt-in antes de enviar mensagens
- [ ] Manter histórico de consentimento
- [ ] Implementar re-opt-in para usuários que optaram out
- [ ] Gerar relatórios de consentimento
- [ ] Integrar com sistema de templates para validação

#### Definição de Pronto
- [ ] Sistema de opt-in/opt-out implementado
- [ ] Validação antes do envio funcionando
- [ ] Histórico de consentimento funcionando
- [ ] Re-opt-in implementado
- [ ] Relatórios de consentimento funcionando
- [ ] Integração com templates funcionando
- [ ] Testes de conformidade LGPD passando

#### Estimativa
**5 Story Points**

#### Dependências
- História 1.6 (Gerenciamento de Templates)
- Sistema de auditoria

#### Notas Técnicas
- Implementar criptografia para dados de consentimento
- Configurar backup automático de dados de consentimento
- Implementar logs de auditoria para mudanças de consentimento
- Configurar retenção de dados conforme LGPD

## Resumo do Epic 1

- **Total de Histórias**: 8
- **Total de Story Points**: 55
- **Estimativa de Tempo**: 3 semanas
- **Dependências Externas**: UAZ API, WhatsApp Business, Storage para mídia
- **Riscos Principais**: Limitações da UAZ API, Complexidade do controle de janela 24h


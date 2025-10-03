# Story 1.5: Controle de Janela de Atendimento

## Status
Draft

## Story

**As a** sistema da plataforma,
**I want** controlar a janela de 24h de atendimento,
**so that** respeite as políticas do WhatsApp

## Acceptance Criteria

1. **Iniciar janela de 24h quando usuário envia mensagem**
2. **Permitir qualquer tipo de mensagem dentro da janela**
3. **Restringir a templates aprovados fora da janela**
4. **Renovar janela quando usuário responde**

## Tasks / Subtasks

- [ ] Task 1: Implementar controle de janela de 24h (AC: 1, 2, 3, 4)
  - [ ] Criar serviço de controle de janela em `src/lib/window-control/`
  - [ ] Implementar lógica de inicialização da janela
  - [ ] Implementar validação de tipo de mensagem baseada na janela
  - [ ] Implementar renovação automática da janela
  - [ ] Adicionar testes unitários para o serviço

- [ ] Task 2: Integrar com UAZ API (AC: 1, 2, 3)
  - [ ] Modificar `src/lib/uaz-api/client.ts` para validar janela
  - [ ] Atualizar `src/app/api/webhook/uaz/route.ts` para controlar janela
  - [ ] Implementar validação de templates fora da janela
  - [ ] Adicionar logs de controle de janela

- [ ] Task 3: Persistir estado da janela (AC: 1, 4)
  - [ ] Usar Redis para armazenar estado da janela por usuário
  - [ ] Implementar TTL automático de 24h
  - [ ] Adicionar métodos de consulta e renovação
  - [ ] Implementar limpeza automática de janelas expiradas

- [ ] Task 4: Testes e validação (AC: 1, 2, 3, 4)
  - [ ] Criar testes de integração para controle de janela
  - [ ] Testar cenários de renovação automática
  - [ ] Validar restrições de template fora da janela
  - [ ] Testar performance com múltiplos usuários

## Dev Notes

### Previous Story Insights
- Story 1.4 implementou o Agent Orchestrator que processa mensagens
- Sistema de memória (Story 1.2) está disponível para persistir contexto
- UAZ API client já implementado com rate limiting e retry logic

### Data Models
- **Window State**: `{ userId: string, windowStart: Date, windowEnd: Date, isActive: boolean }`
- **Message Validation**: Verificar se mensagem é permitida baseada no estado da janela
- **Template Restriction**: Lista de templates aprovados para uso fora da janela

### API Specifications
- **UAZ API**: Usar endpoints existentes em `src/lib/uaz-api/`
- **Webhook Processing**: Modificar `src/app/api/webhook/uaz/route.ts`
- **Redis Operations**: Usar `src/lib/cache/redis-client.ts` para persistência

### Component Specifications
- **Window Control Service**: Novo serviço em `src/lib/window-control/`
- **Message Validator**: Validador de tipo de mensagem baseado na janela
- **Template Manager**: Gerenciador de templates aprovados

### File Locations
- **Service**: `src/lib/window-control/window-service.ts`
- **Types**: `src/lib/window-control/types.ts`
- **Tests**: `src/lib/window-control/__tests__/`
- **Integration**: Modificar `src/app/api/webhook/uaz/route.ts`

### Testing Requirements
- **Unit Tests**: Jest para lógica de controle de janela
- **Integration Tests**: Testes com UAZ API e Redis
- **Performance Tests**: Teste com múltiplos usuários simultâneos
- **Test Data**: Dados de teste para diferentes cenários de janela

### Technical Constraints
- **Redis TTL**: Máximo 24h para janelas de atendimento
- **WhatsApp Policy**: Respeitar políticas de janela de 24h
- **Performance**: Validação de janela deve ser < 100ms
- **Concurrency**: Suportar múltiplos usuários simultâneos

### Testing
- **Test Framework**: Jest + TypeScript
- **Test Location**: `src/lib/window-control/__tests__/`
- **Test Patterns**: Unit tests para lógica, integration tests para UAZ API
- **Coverage**: Mínimo 90% para lógica de controle de janela
- **Test Data**: Mock de usuários e estados de janela

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-12 | 1.0 | Initial story creation | Sarah (PO) |

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Debug Log References
_To be filled by dev agent_

### Completion Notes List
_To be filled by dev agent_

### File List
_To be filled by dev agent_

## QA Results
_To be filled by QA agent_

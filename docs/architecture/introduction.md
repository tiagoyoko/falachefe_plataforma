# Introduction

Este documento define a arquitetura geral do projeto de integração CrewAI no sistema Falachefe, incluindo sistemas backend, serviços compartilhados e preocupações não específicas de UI. Seu objetivo principal é servir como o blueprint arquitetural guia para desenvolvimento orientado por IA, garantindo consistência e aderência aos padrões e tecnologias escolhidas.

**Relacionamento com Arquitetura Frontend:**
O projeto inclui uma interface de usuário significativa (chat interface, dashboard). Um documento separado de Arquitetura Frontend detalhará o design específico do frontend e DEVE ser usado em conjunto com este documento. As escolhas da stack tecnológica central documentadas aqui (ver "Tech Stack") são definitivas para todo o projeto, incluindo componentes frontend.

## Starter Template ou Projeto Existente

Baseado na análise dos documentos fornecidos, este é um projeto **brownfield** que está integrando CrewAI ao sistema Falachefe existente. O projeto atual possui:

- **Stack Existente:** Next.js, TypeScript, Supabase, Redis
- **Arquitetura Atual:** Sistema de agentes legado que será substituído por CrewAI
- **Integração:** UAZ API para WhatsApp, sistema de chat existente
- **Banco de Dados:** Estrutura Supabase já estabelecida

**Decisão Documentada:** N/A - Este é um projeto de migração/integração, não um starter template.

## Risk Assessment Summary

**Riscos Críticos Identificados:**
- **Performance Multi-tenancy:** 20 empresas simultâneas podem sobrecarregar CrewAI (Prob: 70%, Impacto: Alto)
- **Incompatibilidade com Sistema Legado:** CrewAI pode não integrar perfeitamente (Prob: 40%, Impacto: Alto)
- **Dependências Instáveis:** CrewAI v0.80+ em desenvolvimento ativo (Prob: 50%, Impacto: Médio)

**Estratégias de Mitigação:**
- Implementação gradual com fallback para sistema legado
- Load testing extensivo e otimização de Redis cache
- Version pinning e testes de regressão
- Monitoramento proativo desde o início
- PoC limitado (1 empresa, 1 agente) antes da expansão

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2025-01-29 | 1.0 | Criação inicial do documento de arquitetura CrewAI | BMad Master |

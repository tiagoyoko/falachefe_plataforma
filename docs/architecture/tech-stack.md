# Tech Stack

## Cloud Infrastructure
- **Provider:** Vercel + Supabase + Redis Cloud
- **Key Services:** Edge Functions, Database, Cache, Storage
- **Deployment Regions:** us-east-1 (primary), eu-west-1 (backup)

## Technology Stack Table

| Categoria | Tecnologia | Versão | Propósito | Rationale |
|-----------|------------|---------|-----------|-----------|
| **Language** | TypeScript | 5.3.3 | Linguagem principal | Tipagem forte, compatibilidade CrewAI, stack existente |
| **Runtime** | Node.js | 20.11.0 LTS | Runtime JavaScript | Versão LTS estável, suporte CrewAI |
| **Framework** | Next.js | 14.1.0 | Framework web | SSR/SSG, API routes, stack atual |
| **AI Framework** | CrewAI | 0.80.0+ | Orquestração de agentes | Framework principal, 38k+ stars, multi-agent |
| **LLM Integration** | LangChain | 0.2.0+ | Integração LLM | Compatibilidade CrewAI, OpenAI integration |
| **LLM Provider** | OpenAI | 4.0.0+ | Provedor de IA | GPT-4, API estável, rate limits conhecidos |
| **Database** | PostgreSQL | 15+ | Banco principal | Supabase, ACID, suporte JSONB |
| **Cache/Coordination** | Redis | 7.2+ | Cache e coordenação | CrewAI coordination, session management |
| **Authentication** | Better Auth | Latest | Autenticação | Stack atual, multi-tenant support |
| **ORM** | Drizzle | 0.30+ | Mapeamento objeto-relacional | Type-safe, stack atual |
| **API Integration** | UAZ API | Latest | WhatsApp integration | Stack atual, webhook handling |
| **Testing** | Jest | 29+ | Testes unitários | Stack atual, mocking robusto |
| **E2E Testing** | Playwright | 1.40+ | Testes end-to-end | Stack atual, multi-browser |
| **Linting** | ESLint | 8.57+ | Análise de código | Stack atual, TypeScript support |
| **Formatting** | Prettier | 3.2+ | Formatação código | Stack atual, consistência |
| **Deployment** | Vercel | Latest | Plataforma deploy | Stack atual, edge functions |
| **Monitoring** | Vercel Analytics | Latest | Métricas performance | Stack atual, integration nativa |
| **Error Tracking** | Sentry | 7.90+ | Rastreamento erros | Stack atual, error monitoring |
| **Package Manager** | pnpm | 8.15+ | Gerenciador pacotes | Stack atual, performance |

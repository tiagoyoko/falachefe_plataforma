# 🚀 Trigger Deploy - Correção CREWAI_SERVICE_TOKEN

**Data**: 14 de Outubro de 2025  
**Motivo**: Variável de ambiente não está sendo carregada em produção

## Problema

O endpoint `/api/financial/crewai` não consegue validar o token porque `process.env.CREWAI_SERVICE_TOKEN` retorna `undefined`.

## Solução

1. Garantir que a variável está no Vercel
2. Forçar novo deploy para recarregar env vars
3. Testar endpoint novamente

## Variável Necessária

```
CREWAI_SERVICE_TOKEN=e096742e-7b6d-4b6a-b987-41d533adbd50
```

**Escopo**: Production + Preview + Development
**Tipo**: Environment Variable (não Secret para facilitar debug)

---

Este arquivo serve apenas para trigger de deploy via git push.


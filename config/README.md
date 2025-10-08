# Configurações Falachefe CrewAI

Este diretório contém todas as configurações do projeto organizadas de forma centralizada.

## 📁 Estrutura

```
config/
├── env.example          # Exemplo de variáveis de ambiente
├── README.md           # Este arquivo
└── [outras configs]    # Configurações adicionais conforme necessário
```

## 🔧 Configurações Disponíveis

### Variáveis de Ambiente
- **env.example**: Template com todas as variáveis necessárias para o projeto

### Como Usar

1. Copie `env.example` para `.env.local` na raiz do projeto
2. Preencha as variáveis com seus valores específicos
3. Para produção, configure as variáveis no Vercel ou seu provedor

## 🔐 Segurança

⚠️ **Importante**: Nunca commite arquivos `.env` ou `.env.local` no repositório.

## 📚 Documentação

Para mais detalhes sobre configuração, consulte:
- [Documentação de Desenvolvimento](../docs/development/)
- [Documentação de Deploy](../docs/deployment/)

---

*Configurações organizadas em: 2025-01-29*

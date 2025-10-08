# Security

```yaml
security:
  - token: []
```

## Descrição

A API UAZ utiliza autenticação baseada em token para endpoints regulares. O token deve ser fornecido no header `token` de cada requisição.

### Autenticação

- **Tipo**: API Key
- **Header**: `token`
- **Localização**: Header da requisição
- **Descrição**: Token de autenticação da instância para endpoints regulares

### Endpoints Administrativos

Para endpoints administrativos, é necessário usar o header `admintoken` em vez do `token` regular.

- **Tipo**: API Key
- **Header**: `admintoken`
- **Localização**: Header da requisição
- **Descrição**: Token de administrador para endpoints administrativos

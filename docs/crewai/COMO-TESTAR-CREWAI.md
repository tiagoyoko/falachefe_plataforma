# Como Testar CrewAI

Este guia mostra como testar projetos CrewAI seguindo as melhores práticas da documentação oficial.

## 🧪 Tipos de Teste

### 1. Testes Estruturais (Sem API)

Testes que verificam a estrutura do projeto sem fazer chamadas para APIs externas.

```bash
# Teste básico de estrutura
python3 test_crewai.py
```

**O que é testado:**
- ✅ Importação de módulos
- ✅ Estrutura da classe Crew
- ✅ Configuração YAML (agents.yaml, tasks.yaml)
- ✅ Disponibilidade do CLI
- ✅ Comandos do CrewAI

### 2. Testes com API (CrewAI Test)

Testes que executam o crew com chamadas reais para APIs.

```bash
# Teste básico (2 iterações, gpt-4o-mini)
crewai test

# Teste com mais iterações
crewai test -n 5

# Teste com modelo específico
crewai test -n 3 -m gpt-4o

# Teste com modelo específico (forma curta)
crewai test -n 3 -m gpt-4o
```

**O que é testado:**
- ✅ Execução real do crew
- ✅ Performance dos agentes
- ✅ Qualidade das tarefas
- ✅ Métricas de pontuação (1-10)
- ✅ Tempo de execução

## 📊 Interpretando Resultados

### Tabela de Pontuação

```
| Tasks/Crew/Agents  | Run 1 | Run 2 | Avg. Total | Agents | Additional Info |
| :----------------- | :---: | :---: | :--------: | :----: | :-------------: |
| Task 1             |  9.0  |  9.5  |   **9.2**  | Researcher |                |
| Task 2             |  9.0  |  10.0 |   **9.5**  | Reporting Analyst |        |
| Crew               |  9.00 |  9.38 |   **9.2**  |        |                |
| Execution Time (s) |  126  |  145  |   **135**  |        |                |
```

**Interpretação:**
- **Pontuação 9-10**: Excelente performance
- **Pontuação 7-8**: Boa performance
- **Pontuação 5-6**: Performance média
- **Pontuação <5**: Performance baixa, precisa de ajustes

## 🔧 Configuração para Testes

### 1. Variáveis de Ambiente

Crie um arquivo `.env` com suas chaves de API:

```env
# OpenAI API Key (obrigatório)
OPENAI_API_KEY=your-openai-api-key-here

# Serper API Key (para busca web)
SERPER_API_KEY=your-serper-api-key-here

# Outras configurações opcionais
CREWAI_DEBUG=true
CREWAI_VERBOSE=true
```

### 2. Estrutura do Projeto

```
projeto-crewai/
├── src/
│   └── nome_do_projeto/
│       ├── __init__.py
│       ├── crew.py
│       ├── main.py
│       └── config/
│           ├── agents.yaml
│           └── tasks.yaml
├── pyproject.toml
├── .env
└── test_crewai.py
```

## 🚀 Comandos de Teste

### Comandos Básicos

```bash
# Verificar versão do CrewAI
crewai version

# Testar o crew
crewai test

# Executar o crew
crewai run

# Executar com chat interativo
crewai chat
```

### Comandos Avançados

```bash
# Testar com configurações específicas
crewai test -n 10 -m gpt-4o

# Ver logs de execução
crewai log-tasks-outputs

# Resetar memórias
crewai reset-memories --all

# Replay de uma tarefa específica
crewai replay -t task_123456
```

## 📝 Exemplo de Script de Teste

```python
#!/usr/bin/env python3
"""
Script de teste para projetos CrewAI
"""

import sys
from pathlib import Path

def test_imports():
    """Testa se todos os módulos podem ser importados."""
    try:
        from nome_do_projeto.crew import NomeDoCrew
        print("✅ Imports bem-sucedidos")
        return True
    except ImportError as e:
        print(f"❌ Erro de import: {e}")
        return False

def test_crew_structure():
    """Testa se a estrutura do crew está correta."""
    try:
        from nome_do_projeto.crew import NomeDoCrew
        crew_class = NomeDoCrew
        
        # Verificar métodos obrigatórios
        required_methods = ['agent1', 'agent2', 'task1', 'task2', 'crew']
        for method in required_methods:
            if not hasattr(crew_class, method):
                print(f"❌ Método ausente: {method}")
                return False
            print(f"✅ Método encontrado: {method}")
        
        print("✅ Estrutura do crew está correta")
        return True
    except Exception as e:
        print(f"❌ Erro na estrutura: {e}")
        return False

def test_yaml_config():
    """Testa se os arquivos YAML estão corretos."""
    try:
        import yaml
        
        # Testar agents.yaml
        with open('src/nome_do_projeto/config/agents.yaml', 'r') as f:
            agents_config = yaml.safe_load(f)
        
        # Testar tasks.yaml
        with open('src/nome_do_projeto/config/tasks.yaml', 'r') as f:
            tasks_config = yaml.safe_load(f)
        
        print("✅ Configuração YAML está válida")
        return True
    except Exception as e:
        print(f"❌ Erro na configuração YAML: {e}")
        return False

def main():
    """Executa todos os testes."""
    print("🧪 Testando Projeto CrewAI")
    print("=" * 40)
    
    tests = [
        ("Teste de Imports", test_imports),
        ("Teste de Estrutura", test_crew_structure),
        ("Teste de Configuração", test_yaml_config),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Executando {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} falhou")
    
    print(f"\n📊 Resultados: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 Todos os testes passaram!")
        return 0
    else:
        print("⚠️ Alguns testes falharam.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

## 🎯 Dicas para Testes Eficazes

### 1. Teste Incremental
- Comece com testes estruturais
- Adicione testes de API gradualmente
- Use diferentes modelos para comparação

### 2. Configuração de Ambiente
- Use chaves de API de teste quando possível
- Configure logs detalhados para debugging
- Use cache para acelerar testes repetitivos

### 3. Análise de Resultados
- Compare pontuações entre execuções
- Identifique tarefas com baixa performance
- Ajuste prompts e configurações baseado nos resultados

### 4. Troubleshooting Comum

**Erro: "Failed to initialize embedder"**
```bash
# Solução: Configure OPENAI_API_KEY
export OPENAI_API_KEY=your-key-here
```

**Erro: "No module named 'crewai'"**
```bash
# Solução: Instale o CrewAI
pip install crewai
```

**Erro: "YAML config file not found"**
```bash
# Solução: Verifique o caminho dos arquivos YAML
ls -la src/nome_do_projeto/config/
```

## 📚 Recursos Adicionais

- [Documentação Oficial CrewAI](https://docs.crewai.com)
- [CrewAI CLI Reference](https://docs.crewai.com/en/cli)
- [Testing Guide](https://docs.crewai.com/en/testing)
- [Community Forum](https://community.crewai.com)

## 🎉 Conclusão

Seguindo este guia, você pode testar efetivamente seus projetos CrewAI e garantir que estejam funcionando corretamente antes de colocar em produção.

Lembre-se:
1. **Teste a estrutura primeiro** (sem API)
2. **Configure as chaves de API** adequadamente
3. **Use `crewai test`** para testes com API
4. **Analise os resultados** e ajuste conforme necessário
5. **Documente** seus testes e resultados







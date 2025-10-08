#!/bin/bash
# Teste Rápido com Ambiente Virtual Automático
# ==============================================

cd "$(dirname "$0")"

# Ativar ambiente virtual
source .venv/bin/activate

# Executar teste
./test_webhook_quick.sh


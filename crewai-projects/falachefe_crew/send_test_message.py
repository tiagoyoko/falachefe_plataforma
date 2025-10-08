#!/usr/bin/env python3
"""
Envio direto de mensagem de teste via uazapi
"""

import os
import sys
from dotenv import load_dotenv
import json

# Carregar variáveis de ambiente
load_dotenv()

# Adicionar src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from falachefe_crew.tools.uazapi_tools import SendTextMessageTool

# Número de destino
TARGET_NUMBER = "5511992345329"

# Mensagem de teste
TEST_MESSAGE = """🤖 *Teste de Integração Falachefe*

Olá! Esta é uma mensagem de teste do sistema de orquestração Falachefe.

✅ Sistema de agentes IA funcionando
✅ Integração com uazapi ativa
✅ Envio via WhatsApp operacional

*Componentes testados:*
• Agente Orquestrador
• Agente de Suporte  
• Especialistas (Financeiro, Marketing, Vendas, RH)
• Ferramentas de integração WhatsApp

---
🤝 *Falachefe Consultoria*
💼 Especialistas em Gestão para PMEs
📱 Atendimento Inteligente via WhatsApp"""

print("="*70)
print("📱 ENVIANDO MENSAGEM DE TESTE VIA UAZAPI")
print("="*70)

# Verificar token
token = os.getenv("UAZAPI_TOKEN")
base_url = os.getenv("UAZAPI_BASE_URL", "https://free.uazapi.com")

print(f"\n🔍 Configuração:")
print(f"   Base URL: {base_url}")
print(f"   Token: {'✅ Configurado' if token else '❌ NÃO configurado'}")
print(f"   Número destino: {TARGET_NUMBER}")

if not token:
    print("\n❌ ERRO: UAZAPI_TOKEN não configurado no .env")
    sys.exit(1)

print(f"\n📝 Mensagem ({len(TEST_MESSAGE)} caracteres):")
print("-" * 70)
print(TEST_MESSAGE)
print("-" * 70)

print("\n⏳ Enviando mensagem...")

# Enviar
tool = SendTextMessageTool()
result_str = tool._run(
    number=TARGET_NUMBER,
    text=TEST_MESSAGE,
    link_preview=False,
    delay=2000,  # 2 segundos de delay (simula digitação)
    read_chat=True
)

# Parse resultado
result = json.loads(result_str)

print("\n📊 Resultado:")
print("-" * 70)
print(json.dumps(result, indent=2, ensure_ascii=False))
print("-" * 70)

if result.get("success"):
    print("\n" + "🎉"*35)
    print("✅ MENSAGEM ENVIADA COM SUCESSO!")
    print("🎉"*35)
    print(f"\n📌 Message ID: {result.get('message_id', 'N/A')}")
    print(f"📌 Timestamp: {result.get('timestamp', 'N/A')}")
    print(f"📌 Status: {result.get('status', 'N/A')}")
    print(f"\n💡 Verifique o WhatsApp do número {TARGET_NUMBER}")
    sys.exit(0)
else:
    print("\n" + "❌"*35)
    print("❌ FALHA AO ENVIAR MENSAGEM")
    print("❌"*35)
    print(f"\n🔴 Erro: {result.get('error', 'Erro desconhecido')}")
    if 'details' in result:
        print(f"🔴 Detalhes: {result.get('details')}")
    print("\n🔧 Verificações:")
    print("   1. Token está correto?")
    print("   2. Instância WhatsApp está conectada?")
    print("   3. URL base está correta?")
    sys.exit(1)


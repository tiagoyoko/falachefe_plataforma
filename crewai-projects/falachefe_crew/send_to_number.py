#!/usr/bin/env python3
"""
Envio de mensagem de teste via uazapi para número específico
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

# Número de destino (formatado sem + e espaços)
TARGET_NUMBER = "5547992535151"  # +55 47 99253-5151

# Mensagem de teste
TEST_MESSAGE = """🤖 *Teste de Integração Falachefe*

Olá! Esta é uma mensagem de teste do sistema de orquestração Falachefe.

✅ *Sistema Operacional:*
• Agente Orquestrador → Roteia demandas
• Agente de Suporte → Formata e envia
• 4 Especialistas → Financeiro, Marketing, Vendas, RH
• Integração uazapi → WhatsApp API

🎯 *Capacidades:*
• Análise automática de demandas
• Roteamento inteligente para especialistas
• Formatação profissional de mensagens
• Envio automatizado via WhatsApp

💡 *Exemplo de uso:*
"Preciso criar um fluxo de caixa" → 💰 Especialista Financeiro responde

---
🤝 *Falachefe Consultoria*
💼 Especialistas em Gestão para PMEs
📱 Atendimento Inteligente com IA"""

print("="*70)
print("📱 ENVIANDO MENSAGEM DE TESTE VIA UAZAPI")
print("="*70)

# Verificar token
token = os.getenv("UAZAPI_TOKEN")
base_url = os.getenv("UAZAPI_BASE_URL", "https://falachefe.uazapi.com")

print(f"\n🔍 Configuração:")
print(f"   Base URL: {base_url}")
print(f"   Token: {'✅ Configurado' if token else '❌ NÃO configurado'}")
print(f"   Número original: +55 47 99253-5151")
print(f"   Número formatado: {TARGET_NUMBER}")

if not token:
    print("\n❌ ERRO: UAZAPI_TOKEN não configurado no .env")
    sys.exit(1)

print(f"\n📝 Mensagem ({len(TEST_MESSAGE)} caracteres):")
print("-" * 70)
print(TEST_MESSAGE)
print("-" * 70)

print("\n⏳ Enviando mensagem com delay de 2 segundos (simulando digitação)...")

# Enviar
tool = SendTextMessageTool()
result_str = tool._run(
    number=TARGET_NUMBER,
    text=TEST_MESSAGE,
    link_preview=False,
    delay=2000,  # 2 segundos de delay
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
    print(f"\n📌 Detalhes do envio:")
    print(f"   Message ID: {result.get('message_id', 'N/A')}")
    print(f"   Timestamp: {result.get('timestamp', 'N/A')}")
    print(f"   Status: {result.get('status', 'N/A')}")
    print(f"   Número: +55 47 99253-5151")
    print(f"\n💡 Verifique o WhatsApp do número +55 47 99253-5151")
    print(f"\n✨ A mensagem foi enviada com:")
    print(f"   • Formatação profissional")
    print(f"   • Emojis e estrutura clara")
    print(f"   • Delay de digitação (2 segundos)")
    print(f"   • Marcação de leitura automática")
    sys.exit(0)
else:
    print("\n" + "❌"*35)
    print("❌ FALHA AO ENVIAR MENSAGEM")
    print("❌"*35)
    print(f"\n🔴 Erro: {result.get('error', 'Erro desconhecido')}")
    if 'details' in result:
        print(f"🔴 Detalhes: {result.get('details')}")
    print("\n🔧 Verificações sugeridas:")
    print("   1. Token está correto no .env?")
    print("   2. Instância WhatsApp está conectada?")
    print("   3. URL base está correta?")
    print("   4. Número está no formato válido?")
    sys.exit(1)


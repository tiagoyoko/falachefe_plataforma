#!/usr/bin/env python3
"""
Teste de envio de mensagem via uazapi
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

def test_send_message():
    """Testa envio de mensagem via uazapi"""
    
    print("\n" + "="*60)
    print("📱 TESTE DE ENVIO UAZAPI")
    print("="*60)
    
    # Verificar token
    token = os.getenv("UAZAPI_TOKEN")
    base_url = os.getenv("UAZAPI_BASE_URL", "https://free.uazapi.com")
    
    print(f"\n🔍 Configuração:")
    print(f"   Base URL: {base_url}")
    print(f"   Token: {'✅ Configurado' if token else '❌ NÃO configurado'}")
    
    if not token:
        print("\n❌ ERRO: UAZAPI_TOKEN não configurado!")
        print("   Configure no arquivo .env:")
        print("   UAZAPI_TOKEN=seu_token_aqui")
        return False
    
    # Número de destino
    target_number = "5511992345329"
    
    print(f"\n📞 Número de destino: {target_number}")
    
    # Criar mensagem de teste
    test_message = """🤖 *Teste de Integração Falachefe*

Olá! Esta é uma mensagem de teste do sistema de orquestração Falachefe.

✅ Sistema de agentes IA funcionando
✅ Integração com uazapi ativa
✅ Envio via WhatsApp operacional

---
🤝 *Falachefe Consultoria*
💼 Especialistas em Gestão para PMEs
📱 Atendimento Inteligente via WhatsApp"""

    print(f"\n📝 Mensagem a enviar:")
    print("-" * 60)
    print(test_message)
    print("-" * 60)
    
    # Confirmar envio
    confirm = input("\n❓ Confirma o envio desta mensagem? (s/n): ").strip().lower()
    
    if confirm != 's':
        print("\n⚠️  Envio cancelado pelo usuário")
        return False
    
    # Enviar mensagem
    print("\n⏳ Enviando mensagem...")
    
    tool = SendTextMessageTool()
    result_str = tool._run(
        number=target_number,
        text=test_message,
        link_preview=False,
        delay=1000,  # 1 segundo de delay (simula digitação)
        read_chat=True
    )
    
    # Parse do resultado
    result = json.loads(result_str)
    
    print("\n📊 Resultado:")
    print("-" * 60)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print("-" * 60)
    
    if result.get("success"):
        print("\n✅ MENSAGEM ENVIADA COM SUCESSO!")
        print(f"   Message ID: {result.get('message_id', 'N/A')}")
        print(f"   Timestamp: {result.get('timestamp', 'N/A')}")
        print(f"   Status: {result.get('status', 'N/A')}")
        return True
    else:
        print("\n❌ FALHA AO ENVIAR MENSAGEM")
        print(f"   Erro: {result.get('error', 'Erro desconhecido')}")
        if 'details' in result:
            print(f"   Detalhes: {result.get('details')}")
        return False


def test_format_tool():
    """Testa ferramenta de formatação"""
    print("\n" + "="*60)
    print("✨ TESTE DE FORMATAÇÃO DE MENSAGEM")
    print("="*60)
    
    from falachefe_crew.tools.uazapi_tools import FormatResponseTool
    
    # Resposta simulada de um especialista
    specialist_response = """
    Análise do seu fluxo de caixa:
    
    Situação Atual:
    - Saldo: R$ 15.000,00
    - Entradas: R$ 45.000,00
    - Saídas: R$ 38.000,00
    
    Recomendações:
    1. Criar reserva de emergência de R$ 12.000 (3 meses)
    2. Revisar custos fixos - identifiquei 15% de desperdício
    3. Negociar prazos com fornecedores
    """
    
    print("\n📄 Resposta original do especialista:")
    print("-" * 60)
    print(specialist_response)
    print("-" * 60)
    
    # Formatar
    tool = FormatResponseTool()
    result_str = tool._run(
        agent_response=specialist_response,
        format_type="structured",
        add_greeting=True,
        add_signature=True
    )
    
    result = json.loads(result_str)
    
    if result.get("success"):
        print("\n✨ Mensagem formatada:")
        print("-" * 60)
        print(result.get("formatted_text", ""))
        print("-" * 60)
        print(f"\n📊 Caracteres: {result.get('char_count', 0)}")
        print(f"   Formato: {result.get('format_type', 'N/A')}")
        return True
    else:
        print(f"\n❌ Erro ao formatar: {result.get('error')}")
        return False


if __name__ == "__main__":
    try:
        # Teste de formatação primeiro
        test_format_tool()
        
        print("\n" + "─"*60 + "\n")
        
        # Teste de envio
        success = test_send_message()
        
        if success:
            print("\n" + "="*60)
            print("🎉 TESTE CONCLUÍDO COM SUCESSO!")
            print("="*60)
            print("\n💡 Próximos passos:")
            print("   1. Verificar se a mensagem foi recebida no WhatsApp")
            print("   2. Testar com outros tipos de mensagem (menu, mídia)")
            print("   3. Executar: python example_orchestrated_flow.py")
            sys.exit(0)
        else:
            print("\n" + "="*60)
            print("⚠️  TESTE COM PROBLEMAS")
            print("="*60)
            print("\n🔧 Verifique:")
            print("   1. UAZAPI_TOKEN está correto no .env")
            print("   2. Instância do WhatsApp está conectada")
            print("   3. Número está no formato correto (sem + ou espaços)")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


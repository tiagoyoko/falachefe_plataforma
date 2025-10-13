#!/usr/bin/env python3
"""
Webhook Processor para CrewAI
==============================

Processa mensagens recebidas via webhook e retorna respostas do CrewAI.

Uso:
    echo '{"user_message":"Olá","user_id":"test","phone_number":"+55119999999"}' | python webhook_processor.py

Input (via stdin):
    {
        "user_message": "Mensagem do usuário",
        "user_id": "ID do usuário",
        "phone_number": "Telefone do usuário",
        "context": {} // Opcional
    }

Output (via stdout):
    {
        "success": true/false,
        "response": "Resposta do CrewAI",
        "metadata": {
            "processed_at": "ISO timestamp",
            "crew_type": "hierarchical",
            "agents_used": [...],
            "processing_time_ms": 1234
        }
    }
"""

import sys
import json
import os
from datetime import datetime
from time import time

# Adicionar src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from falachefe_crew.crew import FalachefeCrew


def process_webhook_message(inputs: dict) -> dict:
    """
    Processa mensagem do webhook com CrewAI Orchestrated Crew
    
    Args:
        inputs: Dicionário com:
            - user_message (str): Mensagem do usuário
            - user_id (str): ID do usuário
            - phone_number (str): Telefone do usuário
            - context (dict, opcional): Contexto adicional
    
    Returns:
        dict: Resultado do processamento
    """
    start_time = time()
    
    try:
        # Log de início
        print(f"📥 Processing message: {inputs.get('user_message', '')[:50]}...", file=sys.stderr)
        print(f"👤 User ID: {inputs.get('user_id')}", file=sys.stderr)
        
        # Validar inputs obrigatórios
        if not inputs.get("user_message"):
            raise ValueError("user_message is required")
        
        if not inputs.get("user_id"):
            raise ValueError("user_id is required")
        
        # AVISO: Este webhook processor está obsoleto
        # Use o classificador no api_server.py para determinar o especialista correto
        print("⚠️ webhook_processor.py está obsoleto. Use api_server.py com classificador", file=sys.stderr)
        
        # Preparar inputs básicos
        user_message = inputs.get("user_message", inputs.get("user_request", ""))
        user_id = inputs.get("user_id", "")
        phone = inputs.get("phone_number", inputs.get("whatsapp_number", ""))
        
        crew_inputs = {
            "user_request": user_message,
            "user_context": inputs.get("context", {}).get("user_context", "Cliente via webhook"),
            "whatsapp_number": phone,
            "specialist_response": "Use o endpoint /process com classificador",
            "specialist_type": "none",
            "conversation_context": f"Usuário {user_id} solicitou: {user_message}",
            "user_id": user_id,
            "phone_number": phone,
            "user_message": user_message,
            "company_context": "Pequena empresa via webhook",
            "transaction_type": "consulta",
            "transaction_data": {},
            
            # Contexto adicional
            **inputs.get("context", {})
        }
        
        print(f"⚠️ Este endpoint está obsoleto", file=sys.stderr)
        
        # Calcular tempo de processamento
        processing_time = int((time() - start_time) * 1000)  # em ms
        
        # Retornar mensagem informativa
        return {
            "success": False,
            "error": "webhook_processor está obsoleto. Use o endpoint /process com classificador LLM",
            "response": "Por favor, use o endpoint /process que utiliza o classificador para determinar o especialista correto.",
            "metadata": {
                "processed_at": datetime.now().isoformat(),
                "crew_type": "deprecated",
                "agents_used": [],
                "processing_time_ms": processing_time,
                "user_id": inputs.get("user_id"),
                "phone_number": inputs.get("phone_number")
            }
        }
        
    except ValueError as e:
        # Erro de validação
        print(f"❌ Validation error: {str(e)}", file=sys.stderr)
        return {
            "success": False,
            "response": f"Erro de validação: {str(e)}",
            "metadata": {
                "error": str(e),
                "error_type": "ValidationError",
                "processed_at": datetime.now().isoformat(),
                "processing_time_ms": int((time() - start_time) * 1000)
            }
        }
        
    except Exception as e:
        # Erro geral
        print(f"❌ Error processing message: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        
        return {
            "success": False,
            "response": "Desculpe, houve um erro ao processar sua mensagem. Tente novamente em instantes.",
            "metadata": {
                "error": str(e),
                "error_type": type(e).__name__,
                "processed_at": datetime.now().isoformat(),
                "processing_time_ms": int((time() - start_time) * 1000)
            }
        }


def main():
    """
    Função principal
    
    Lê JSON do stdin, processa com CrewAI, escreve JSON no stdout.
    Logs vão para stderr para não poluir stdout.
    """
    try:
        # Ler input do stdin
        print("📖 Reading input from stdin...", file=sys.stderr)
        input_data = sys.stdin.read()
        
        if not input_data or input_data.strip() == '':
            raise ValueError("No input data received")
        
        print(f"📦 Received {len(input_data)} bytes of data", file=sys.stderr)
        
        # Parse JSON
        try:
            inputs = json.loads(input_data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {str(e)}")
        
        print(f"✅ Input parsed successfully", file=sys.stderr)
        
        # Processar com CrewAI
        result = process_webhook_message(inputs)
        
        # Escrever resultado no stdout (SOMENTE JSON, sem logs)
        print(json.dumps(result, ensure_ascii=False))
        
        # Exit code baseado no sucesso
        sys.exit(0 if result.get("success") else 1)
        
    except Exception as e:
        # Erro crítico
        print(f"💥 Critical error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        
        # Retornar erro como JSON
        error_result = {
            "success": False,
            "response": "Erro interno ao processar mensagem",
            "metadata": {
                "error": str(e),
                "error_type": type(e).__name__,
                "processed_at": datetime.now().isoformat()
            }
        }
        
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()


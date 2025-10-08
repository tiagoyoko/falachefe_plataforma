#!/usr/bin/env python3
"""
API Server Flask para processar mensagens com CrewAI
Roda no Railway e é chamado via Upstash QStash

Endpoints:
- POST /process - Processa mensagem com CrewAI e envia resposta via UAZAPI
- GET /health - Health check
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
import requests
from datetime import datetime
from time import time

# Adicionar src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from falachefe_crew.crew import FalachefeCrew

app = Flask(__name__)
CORS(app)  # Permitir CORS para chamadas do QStash

# Configurações
UAZAPI_BASE_URL = os.getenv("UAZAPI_BASE_URL", "https://falachefe.uazapi.com")
UAZAPI_TOKEN = os.getenv("UAZAPI_TOKEN", "")
QSTASH_CURRENT_SIGNING_KEY = os.getenv("QSTASH_CURRENT_SIGNING_KEY", "")
QSTASH_NEXT_SIGNING_KEY = os.getenv("QSTASH_NEXT_SIGNING_KEY", "")

# Cache do crew (inicializar apenas uma vez)
crew_instance = None


def get_crew():
    """Retorna instância singleton do crew"""
    global crew_instance
    if crew_instance is None:
        print("🚀 Initializing FalachefeCrew...", file=sys.stderr)
        crew_instance = FalachefeCrew()
        print("✅ FalachefeCrew initialized", file=sys.stderr)
    return crew_instance


def verify_qstash_signature(request):
    """
    Verifica assinatura do QStash para segurança
    Ref: https://upstash.com/docs/qstash/features/security
    """
    if not QSTASH_CURRENT_SIGNING_KEY:
        # Se não configurado, aceitar (desenvolvimento)
        return True
    
    signature = request.headers.get('Upstash-Signature')
    if not signature:
        return False
    
    # TODO: Implementar verificação completa de assinatura
    # Por enquanto, apenas verificar se header existe
    return True


def send_to_uazapi(phone_number: str, message: str) -> dict:
    """
    Envia mensagem para o usuário via UAZAPI
    
    Args:
        phone_number: Número do WhatsApp do destinatário
        message: Texto da mensagem
    
    Returns:
        dict: Resposta da API UAZAPI
    """
    try:
        url = f"{UAZAPI_BASE_URL}/send/text"
        
        payload = {
            "number": phone_number,
            "text": message,
            "readchat": True
        }
        
        headers = {
            "token": UAZAPI_TOKEN,
            "Content-Type": "application/json"
        }
        
        print(f"📤 Sending to UAZAPI: {phone_number}", file=sys.stderr)
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        print(f"✅ Message sent: {result.get('messageid')}", file=sys.stderr)
        
        return {
            "success": True,
            "messageid": result.get("messageid"),
            "status": result.get("status")
        }
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error sending to UAZAPI: {str(e)}", file=sys.stderr)
        return {
            "success": False,
            "error": str(e)
        }


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "falachefe-crewai-api",
        "timestamp": datetime.now().isoformat(),
        "crew_initialized": crew_instance is not None,
        "uazapi_configured": bool(UAZAPI_TOKEN),
        "qstash_configured": bool(QSTASH_CURRENT_SIGNING_KEY)
    })


@app.route('/process', methods=['POST'])
def process_message():
    """
    Processa mensagem com CrewAI e envia resposta via UAZAPI
    
    Body esperado:
    {
        "message": "Mensagem do usuário",
        "userId": "ID do usuário",
        "phoneNumber": "Número do WhatsApp",
        "context": {
            "conversationId": "...",
            "chatName": "...",
            "isNewUser": false
        }
    }
    """
    start_time = time()
    
    try:
        # Verificar assinatura do QStash (segurança)
        if not verify_qstash_signature(request):
            return jsonify({
                "success": False,
                "error": "Invalid QStash signature"
            }), 401
        
        # Parse do body
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data provided"
            }), 400
        
        # Extrair dados
        user_message = data.get('message', '')
        user_id = data.get('userId', '')
        phone_number = data.get('phoneNumber', '')
        context = data.get('context', {})
        
        # Validações
        if not user_message:
            return jsonify({
                "success": False,
                "error": "message is required"
            }), 400
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "userId is required"
            }), 400
        
        if not phone_number:
            return jsonify({
                "success": False,
                "error": "phoneNumber is required"
            }), 400
        
        print(f"📥 Processing message from {phone_number}", file=sys.stderr)
        print(f"💬 Message: {user_message[:50]}...", file=sys.stderr)
        
        # Obter crew
        crew = get_crew()
        orchestrated = crew.orchestrated_crew()
        
        # Preparar inputs para o crew
        crew_inputs = {
            "user_request": user_message,
            "user_context": context.get("userName", "Cliente via WhatsApp"),
            "whatsapp_number": phone_number,
            "specialist_response": "Processando...",
            "specialist_type": "orchestrator",
            "conversation_context": f"Usuário {user_id}: {user_message}",
            "user_id": user_id,
            "phone_number": phone_number,
            "user_message": user_message,
            "company_context": "Pequena empresa",
            "transaction_type": "consulta",
            "transaction_data": {},
            **context
        }
        
        print("🤖 Executing CrewAI...", file=sys.stderr)
        
        # Executar crew
        result = orchestrated.kickoff(inputs=crew_inputs)
        
        processing_time = int((time() - start_time) * 1000)
        
        print(f"✅ CrewAI completed in {processing_time}ms", file=sys.stderr)
        
        # Extrair resposta (pode ser string ou objeto)
        response_text = str(result)
        
        # Enviar resposta para o usuário via UAZAPI
        print("📤 Sending response to user...", file=sys.stderr)
        send_result = send_to_uazapi(phone_number, response_text)
        
        # Retornar resultado
        return jsonify({
            "success": True,
            "response": response_text,
            "sent_to_user": send_result.get("success", False),
            "uazapi_messageid": send_result.get("messageid"),
            "metadata": {
                "processed_at": datetime.now().isoformat(),
                "processing_time_ms": processing_time,
                "user_id": user_id,
                "phone_number": phone_number
            }
        })
        
    except Exception as e:
        print(f"❌ Error processing message: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        
        # Tentar enviar mensagem de erro ao usuário
        if phone_number:
            send_to_uazapi(
                phone_number,
                "Desculpe, houve um erro ao processar sua mensagem. Tente novamente em alguns instantes."
            )
        
        return jsonify({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "metadata": {
                "processed_at": datetime.now().isoformat(),
                "processing_time_ms": int((time() - start_time) * 1000)
            }
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    print(f"🚀 Starting Falachefe CrewAI API on port {port}", file=sys.stderr)
    print(f"📡 UAZAPI: {UAZAPI_BASE_URL}", file=sys.stderr)
    print(f"🔑 Token: {'✅ Configured' if UAZAPI_TOKEN else '❌ NOT SET'}", file=sys.stderr)
    app.run(host='0.0.0.0', port=port, debug=False)


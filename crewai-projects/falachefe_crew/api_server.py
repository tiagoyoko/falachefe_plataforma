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
from crewai import Crew, Process, Task

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


def get_user_company_data(user_id: str) -> dict:
    """
    Busca dados reais do usuário e empresa do Supabase
    
    Retorna:
    - company_name: Nome da empresa
    - company_sector: Setor da empresa
    - company_size: Tamanho da empresa
    - user_name: Nome do usuário
    - user_role: Cargo do usuário
    """
    try:
        # URL do Supabase
        supabase_url = os.getenv("SUPABASE_URL", "https://zpdartuyaergbxmbmtur.supabase.co")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY", "")
        
        if not supabase_key:
            print("⚠️ SUPABASE_SERVICE_ROLE_KEY not configured, using defaults", file=sys.stderr)
            return {
                "company_name": "Empresa não identificada",
                "company_sector": "não especificado",
                "company_size": "não especificado",
                "user_name": "Cliente",
                "user_role": "não especificado"
            }
        
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        }
        
        # Buscar dados do usuário via user_onboarding
        response = requests.get(
            f"{supabase_url}/rest/v1/user_onboarding?user_id=eq.{user_id}&select=first_name,last_name,whatsapp_phone,company_name,industry,company_size,position",
            headers=headers
        )
        
        if response.status_code == 200 and response.json():
            data = response.json()[0]
            full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
            return {
                "company_name": data.get("company_name", "Empresa"),
                "company_sector": data.get("industry", "não especificado"),
                "company_size": data.get("company_size", "não especificado"),
                "user_name": full_name or "Cliente",
                "user_role": data.get("position", "não especificado")
            }
        else:
            print(f"⚠️ User not found in user_onboarding: {user_id}", file=sys.stderr)
            return {
                "company_name": "Empresa não cadastrada",
                "company_sector": "não especificado",
                "company_size": "não especificado",
                "user_name": "Cliente",
                "user_role": "não especificado"
            }
            
    except Exception as e:
        print(f"⚠️ Error fetching user data: {e}", file=sys.stderr)
        return {
            "company_name": "Erro ao buscar dados",
            "company_sector": "não especificado",
            "company_size": "não especificado",
            "user_name": "Cliente",
            "user_role": "não especificado"
        }


def save_agent_message(
    conversation_id: str,
    agent_id: str,
    content: str,
    metadata: dict = None
) -> bool:
    """
    Salva mensagem do agente no Supabase
    
    Args:
        conversation_id: ID da conversação
        agent_id: ID do agente (ex: 'financial_expert', 'crewai')
        content: Conteúdo da mensagem
        metadata: Metadados adicionais
    
    Returns:
        True se salvou com sucesso, False caso contrário
    """
    try:
        supabase_url = os.getenv("SUPABASE_URL", "https://zpdartuyaergbxmbmtur.supabase.co")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY", "")
        
        if not supabase_key:
            print("⚠️ SUPABASE_SERVICE_ROLE_KEY not configured, cannot save agent message", file=sys.stderr)
            return False
        
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        # Preparar payload
        payload = {
            "conversation_id": conversation_id,
            "sender_id": agent_id,
            "sender_type": "agent",
            "content": content,
            "message_type": "text",
            "status": "delivered",
            "metadata": metadata or {},
            "sent_at": datetime.now().isoformat(),
            "delivered_at": datetime.now().isoformat()
        }
        
        # Salvar no Supabase
        response = requests.post(
            f"{supabase_url}/rest/v1/messages",
            json=payload,
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            message_data = response.json()
            if isinstance(message_data, list) and len(message_data) > 0:
                print(f"✅ Agent message saved: {message_data[0].get('id')}", file=sys.stderr)
                return True
            elif isinstance(message_data, dict):
                print(f"✅ Agent message saved: {message_data.get('id')}", file=sys.stderr)
                return True
        else:
            print(f"⚠️ Failed to save agent message: {response.status_code} - {response.text}", file=sys.stderr)
            return False
    
    except Exception as e:
        print(f"⚠️ Error saving agent message: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False


def get_financial_status(user_id: str) -> str:
    """
    Busca status financeiro real do usuário do Supabase
    
    Retorna resumo do fluxo de caixa baseado em financial_data:
    - Total de receitas
    - Total de despesas
    - Saldo atual
    - Últimas 3 transações
    """
    try:
        supabase_url = os.getenv("SUPABASE_URL", "https://zpdartuyaergbxmbmtur.supabase.co")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY", "")
        
        if not supabase_key:
            return "Status financeiro não disponível. Cliente está iniciando uso da plataforma."
        
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        }
        
        # Buscar todas transações do usuário
        response = requests.get(
            f"{supabase_url}/rest/v1/financial_data?user_id=eq.{user_id}&select=type,amount,description,category,date&order=date.desc&limit=100",
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"⚠️ Failed to fetch financial data: {response.status_code}", file=sys.stderr)
            return "Sem dados financeiros registrados ainda."
        
        transactions = response.json()
        
        if not transactions or len(transactions) == 0:
            return "Nenhuma transação financeira registrada ainda. Cliente está começando a usar o sistema."
        
        # Calcular totais
        total_receitas = sum(t['amount'] for t in transactions if t['type'] == 'receita')
        total_despesas = sum(t['amount'] for t in transactions if t['type'] == 'despesa')
        saldo = total_receitas - total_despesas
        
        # Formatar valores (de centavos para reais)
        receitas_brl = total_receitas / 100
        despesas_brl = total_despesas / 100
        saldo_brl = saldo / 100
        
        # Pegar últimas 3 transações
        ultimas_transacoes = transactions[:3]
        transacoes_texto = []
        for t in ultimas_transacoes:
            valor_brl = t['amount'] / 100
            tipo_emoji = "💰" if t['type'] == 'receita' else "💸"
            transacoes_texto.append(
                f"{tipo_emoji} R$ {valor_brl:.2f} - {t['description']} ({t['category']})"
            )
        
        # Montar resumo
        resumo = f"""Resumo Financeiro:
- Total Receitas: R$ {receitas_brl:.2f}
- Total Despesas: R$ {despesas_brl:.2f}
- Saldo Atual: R$ {saldo_brl:.2f}
- Total de Transações: {len(transactions)}

Últimas Transações:
{chr(10).join(transacoes_texto)}"""
        
        return resumo
        
    except Exception as e:
        print(f"⚠️ Error fetching financial status: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return "Erro ao buscar status financeiro. Cliente será orientado a registrar dados."


def classify_message_with_llm(message: str, conversation_history: list = None) -> dict:
    """
    Classificador inteligente com LLM
    
    Analisa a mensagem e retorna:
    - type: 'greeting', 'acknowledgment', 'financial_task', 'marketing_query', 'sales_query', 'hr_query', 'general'
    - specialist: qual agente deve responder ('none', 'financial_expert', 'marketing_expert', etc)
    - response: resposta direta (se não precisa especialista)
    - needs_specialist: bool
    - confidence: 0-1
    """
    import openai
    
    # Prompt para o classificador
    system_prompt = """Você é um classificador de intenções para uma plataforma de consultoria empresarial.

Analise a mensagem do usuário e classifique em UMA das categorias:

1. **greeting** - Saudações simples (oi, olá, bom dia)
2. **acknowledgment** - Agradecimentos ou confirmações (obrigado, ok, entendi)
3. **financial_task** - Tarefas específicas de finanças (adicionar receita/despesa, ver fluxo de caixa, análise financeira)
4. **marketing_query** - Dúvidas sobre marketing digital, redes sociais, estratégias
5. **sales_query** - Questões sobre vendas, processos comerciais, fechamento
6. **hr_query** - Questões sobre RH, gestão de pessoas, questões trabalhistas
7. **continuation** - Continuação de conversa anterior (palavras como "também", "além disso", "e")
8. **general** - Questão geral que precisa do orquestrador

Retorne APENAS um JSON no formato:
{
  "type": "categoria",
  "specialist": "none|financial_expert|marketing_sales_expert|hr_expert",
  "confidence": 0.95,
  "reasoning": "breve explicação"
}"""

    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",  # Modelo rápido e barato
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Mensagem: {message}"}
            ],
            temperature=0.3,
            max_tokens=150
        )
        
        # Parse da resposta
        result_text = response.choices[0].message.content.strip()
        
        # Remover markdown se houver
        if result_text.startswith('```'):
            result_text = result_text.split('```')[1]
            if result_text.startswith('json'):
                result_text = result_text[4:]
        
        classification = json.loads(result_text)
        
        # Adicionar respostas diretas para casos simples
        if classification['type'] == 'greeting':
            classification['response'] = '''Olá! 👋 Seja bem-vindo ao FalaChefe!

Sou seu assistente de consultoria empresarial. Posso ajudar com:

📊 **Finanças**: Fluxo de caixa, análise financeira
📱 **Marketing**: Estratégias digitais, redes sociais  
💰 **Vendas**: Processos comerciais, fechamento
👥 **RH**: Gestão de pessoas, questões trabalhistas

Como posso ajudar sua empresa hoje?'''
            classification['needs_specialist'] = False
        
        elif classification['type'] == 'acknowledgment':
            classification['response'] = 'Por nada! Estou aqui para ajudar. Precisa de algo mais?'
            classification['needs_specialist'] = False
        
        else:
            classification['response'] = None
            classification['needs_specialist'] = True
        
        return classification
        
    except Exception as e:
        print(f"⚠️ LLM classification failed: {e}", file=sys.stderr)
        print("Falling back to keyword-based classification", file=sys.stderr)
        
        # Fallback: classificação básica por keywords
        message_lower = message.lower().strip()
        
        # Saudações
        greetings = ['oi', 'olá', 'ola', 'hey', 'e aí', 'eae', 'opa', 'bom dia', 'boa tarde', 'boa noite']
        if message_lower in greetings or len(message_lower) <= 3:
            return {
                'type': 'greeting',
                'specialist': 'none',
                'confidence': 0.9,
                'response': 'Olá! Como posso ajudar?',
                'needs_specialist': False
            }
        
        # Keywords financeiras
        financial_kw = ['fluxo de caixa', 'receita', 'despesa', 'financeiro', 'dinheiro', 'reais', 'lucro', 'prejuízo']
        if any(kw in message_lower for kw in financial_kw):
            return {
                'type': 'financial_task',
                'specialist': 'financial_expert',
                'confidence': 0.7,
                'needs_specialist': True
            }
        
        # Default: questão geral (será tratada como não especializada)
        return {
            'type': 'general',
            'specialist': 'none',
            'confidence': 0.5,
            'needs_specialist': False
        }


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
    import psutil
    
    # Calcular uptime
    uptime = time() - getattr(app, 'start_time', time())
    
    return jsonify({
        "status": "healthy",
        "service": "falachefe-crewai-api",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": int(uptime),
        "crew_initialized": crew_instance is not None,
        "uazapi_configured": bool(UAZAPI_TOKEN),
        "qstash_configured": bool(QSTASH_CURRENT_SIGNING_KEY),
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent
        }
    })


@app.route('/metrics', methods=['GET'])
def metrics():
    """Métricas para Prometheus (formato básico)"""
    import psutil
    
    uptime = time() - getattr(app, 'start_time', time())
    
    metrics_text = f"""# HELP falachefe_uptime_seconds Uptime do serviço
# TYPE falachefe_uptime_seconds gauge
falachefe_uptime_seconds {int(uptime)}

# HELP falachefe_crew_initialized CrewAI inicializado (1=sim, 0=não)
# TYPE falachefe_crew_initialized gauge
falachefe_crew_initialized {1 if crew_instance else 0}

# HELP falachefe_cpu_percent Uso de CPU
# TYPE falachefe_cpu_percent gauge
falachefe_cpu_percent {psutil.cpu_percent(interval=0.1)}

# HELP falachefe_memory_percent Uso de memória
# TYPE falachefe_memory_percent gauge
falachefe_memory_percent {psutil.virtual_memory().percent}

# HELP falachefe_disk_percent Uso de disco
# TYPE falachefe_disk_percent gauge
falachefe_disk_percent {psutil.disk_usage('/').percent}
"""
    
    return metrics_text, 200, {'Content-Type': 'text/plain; charset=utf-8'}


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
        
        # Classificar mensagem com LLM
        classification = classify_message_with_llm(user_message)
        print(f"🔍 Classification: {classification['type']} → {classification['specialist']} (confidence: {classification.get('confidence', 0)})", file=sys.stderr)
        
        # Se não precisa especialista (saudação/agradecimento), responder direto
        if not classification['needs_specialist']:
            response_text = classification['response']
            processing_time = int((time() - start_time) * 1000)
            print(f"✅ Direct response (no CrewAI) in {processing_time}ms", file=sys.stderr)
        else:
            # Mensagem precisa de especialista → usar CrewAI
            specialist_type = classification['specialist']
            print(f"🤖 Routing to {specialist_type}...", file=sys.stderr)
            
            # Buscar dados REAIS do usuário e empresa
            print(f"📊 Fetching real user and company data for {user_id}...", file=sys.stderr)
            user_company_data = get_user_company_data(user_id)
            financial_status = get_financial_status(user_id)
            
            print(f"✅ Company: {user_company_data['company_name']} | Sector: {user_company_data['company_sector']}", file=sys.stderr)
            
            # Obter crew
            crew_class = get_crew()
            
            # Montar contexto da empresa com dados reais
            company_context = f"""Empresa: {user_company_data['company_name']}
Setor: {user_company_data['company_sector']}
Porte: {user_company_data['company_size']}
Contato: {user_company_data['user_name']} ({user_company_data['user_role']})"""
            
            # Preparar inputs base (todas as variáveis possíveis que as tasks podem usar)
            base_inputs = {
                # Variáveis básicas
                "user_id": user_id,  # ID do usuário
                "user_request": user_message,
                "user_context": user_company_data['user_name'],
                "whatsapp_number": phone_number,
                "phone_number": phone_number,
                "user_message": user_message,
                "message": user_message,
                
                # Para financial_advice task (DADOS REAIS)
                "question": user_message,  # Pergunta/solicitação do usuário
                "company_context": company_context,  # Contexto real da empresa
                "financial_status": financial_status,  # Status financeiro real
                
                # Para outras tasks financeiras
                "period": "atual",
                "cashflow_data": {},
                "transaction_type": "consulta",
                "transaction_data": {},
                
                # Para marketing
                "topic": user_message,
                "area": "geral",
                "marketing_question": user_message,
                "company_info": company_context,
                "marketing_goal": "conforme solicitação do cliente",
                "budget": "a definir com o cliente",
                
                # Para sales
                "sales_question": user_message,
                "sales_type": "a definir conforme contexto",
                "product_info": "produtos/serviços da empresa",
                "current_challenge": user_message,
                
                # Para HR
                "hr_question": user_message,
                "employee_count": "não especificado",
                
                **context
            }
            
            # Rotear para agente específico OU orquestrador
            if specialist_type == 'financial_expert':
                # Criar crew com APENAS financial_expert + task
                agent = crew_class.financial_expert()
                task = crew_class.financial_advice()
                
                # Crew simples: 1 agente, 1 task, processo sequencial
                simple_crew = Crew(
                    agents=[agent],
                    tasks=[task],
                    process=Process.sequential,
                    verbose=True
                )
                result = simple_crew.kickoff(inputs=base_inputs)
            
            elif specialist_type in ['marketing_expert', 'sales_expert', 'marketing_sales_expert']:
                # Unificado: Marketing + Vendas = Max
                agent = crew_class.marketing_sales_expert()
                task = crew_class.marketing_sales_plan()
                simple_crew = Crew(
                    agents=[agent],
                    tasks=[task],
                    process=Process.sequential,
                    verbose=True
                )
                result = simple_crew.kickoff(inputs=base_inputs)
            
            elif specialist_type == 'hr_expert':
                agent = crew_class.hr_expert()
                task = crew_class.hr_guidance()
                simple_crew = Crew(
                    agents=[agent],
                    tasks=[task],
                    process=Process.sequential,
                    verbose=True
                )
                result = simple_crew.kickoff(inputs=base_inputs)
            
            else:
                # Questão geral → resposta padrão
                print("ℹ️ General query without specific specialist", file=sys.stderr)
                result = "Olá! Sou o assistente do FalaChefe. Como posso ajudá-lo com sua empresa hoje? Posso auxiliar em:\n\n💰 Finanças (fluxo de caixa, custos)\n📱 Marketing e Vendas\n👥 Gestão de Pessoas"
            
            processing_time = int((time() - start_time) * 1000)
            
            print(f"✅ CrewAI completed in {processing_time}ms", file=sys.stderr)
            
            # Extrair resposta (pode ser string ou objeto)
            response_text = str(result)
        
        # Salvar mensagem do agente no banco de dados
        conversation_id = context.get('conversationId', f'conv_{user_id}_{int(time())}')
        agent_id = specialist_type if 'specialist_type' in locals() else 'crewai'
        
        save_agent_message(
            conversation_id=conversation_id,
            agent_id=agent_id,
            content=response_text,
            metadata={
                "specialist_type": agent_id,
                "processing_time_ms": processing_time,
                "classification": classification.get('type', 'unknown') if 'classification' in locals() else 'unknown',
                "source": context.get('source', 'whatsapp'),
                "timestamp": datetime.now().isoformat()
            }
        )
        
        # Detectar se é chat web ou WhatsApp baseado APENAS no context.source
        # Usuários do chat web têm telefone válido mas acessam pela página
        is_web_chat = context.get('source') == 'web-chat'
        
        send_result = {
            "success": True,
            "source": "web-chat" if is_web_chat else "whatsapp"
        }
        
        # Enviar resposta via UAZAPI apenas para WhatsApp
        if not is_web_chat:
            print("📤 Sending response to WhatsApp user...", file=sys.stderr)
            send_result = send_to_uazapi(phone_number, response_text)
        else:
            print("💬 Web chat - skipping UAZAPI send", file=sys.stderr)
        
        # Retornar resultado
        return jsonify({
            "success": True,
            "response": response_text,
            "sent_to_user": send_result.get("success", True),  # True para web chat
            "uazapi_messageid": send_result.get("messageid"),
            "source": send_result.get("source", "whatsapp"),
            "metadata": {
                "processed_at": datetime.now().isoformat(),
                "processing_time_ms": processing_time,
                "user_id": user_id,
                "phone_number": phone_number if not is_web_chat else "web-chat"
            }
        })
        
    except Exception as e:
        print(f"❌ Error processing message: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        
        # Tentar enviar mensagem de erro ao usuário (apenas WhatsApp)
        is_web_chat = context.get('source') == 'web-chat'
        if phone_number and not is_web_chat:
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
    app.start_time = time()  # Registrar tempo de início
    print(f"🚀 Starting Falachefe CrewAI API on port {port}", file=sys.stderr)
    print(f"📡 UAZAPI: {UAZAPI_BASE_URL}", file=sys.stderr)
    print(f"🔑 Token: {'✅ Configured' if UAZAPI_TOKEN else '❌ NOT SET'}", file=sys.stderr)
    app.run(host='0.0.0.0', port=port, debug=False)


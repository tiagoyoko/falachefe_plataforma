"""
Ferramentas (Tools) para integração com uazapi (WhatsApp API)
Permite aos agentes enviar mensagens formatadas via WhatsApp
"""

from typing import Type, Optional, Dict, List, Any
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
import json
import requests
import os
from datetime import datetime

# ============================================
# CONFIGURAÇÃO DA API UAZAPI
# ============================================

UAZAPI_BASE_URL = os.getenv("UAZAPI_BASE_URL", "https://free.uazapi.com")
UAZAPI_TOKEN = os.getenv("UAZAPI_TOKEN", "")
API_TIMEOUT = 30  # segundos

# ============================================
# SCHEMAS DE INPUT (Pydantic Models)
# ============================================

class SendTextMessageInput(BaseModel):
    """Input para enviar mensagem de texto via WhatsApp."""
    number: str = Field(..., description="Número do destinatário no formato internacional (ex: 5511999999999)")
    text: str = Field(..., description="Texto da mensagem a ser enviada")
    link_preview: Optional[bool] = Field(False, description="Ativar preview de links")
    delay: Optional[int] = Field(0, description="Delay em milissegundos antes do envio (simula digitação)")
    read_chat: Optional[bool] = Field(True, description="Marcar chat como lido após envio")


class SendFormattedMessageInput(BaseModel):
    """Input para enviar mensagem formatada com estrutura (seções, listas, etc)."""
    number: str = Field(..., description="Número do destinatário no formato internacional")
    title: str = Field(..., description="Título da mensagem")
    sections: List[Dict[str, Any]] = Field(..., description="Lista de seções com conteúdo formatado")
    footer: Optional[str] = Field(None, description="Rodapé opcional")
    delay: Optional[int] = Field(0, description="Delay em milissegundos antes do envio")


class SendMenuMessageInput(BaseModel):
    """Input para enviar menu interativo via WhatsApp."""
    number: str = Field(..., description="Número do destinatário")
    text: str = Field(..., description="Texto principal do menu")
    choices: List[str] = Field(..., description="Lista de opções do menu")
    menu_type: Optional[str] = Field("button", description="Tipo do menu: 'button', 'list', 'poll'")
    footer_text: Optional[str] = Field(None, description="Texto do rodapé")
    list_button: Optional[str] = Field("Ver opções", description="Texto do botão da lista")


class SendMediaMessageInput(BaseModel):
    """Input para enviar mídia (imagem, vídeo, documento, áudio)."""
    number: str = Field(..., description="Número do destinatário")
    media_type: str = Field(..., description="Tipo: 'image', 'video', 'document', 'audio', 'ptt'")
    file: str = Field(..., description="URL ou base64 do arquivo")
    caption: Optional[str] = Field(None, description="Legenda/caption da mídia")
    doc_name: Optional[str] = Field(None, description="Nome do arquivo (para documentos)")


# ============================================
# FERRAMENTAS (TOOLS)
# ============================================

class SendTextMessageTool(BaseTool):
    """
    Ferramenta para enviar mensagens de texto via WhatsApp (uazapi)
    
    Use esta ferramenta quando precisar:
    - Enviar mensagens de texto simples para usuários
    - Responder perguntas via WhatsApp
    - Enviar confirmações ou notificações
    
    A mensagem será enviada automaticamente para o número especificado.
    """
    name: str = "Enviar Mensagem de Texto WhatsApp"
    description: str = (
        "Envia uma mensagem de texto para um número de WhatsApp. "
        "Use para enviar respostas, confirmações ou notificações ao usuário. "
        "Parâmetros: number (número do destinatário), text (conteúdo da mensagem), "
        "link_preview (ativar preview de links), delay (simular digitação)"
    )
    args_schema: Type[BaseModel] = SendTextMessageInput

    def _run(
        self,
        number: str,
        text: str,
        link_preview: Optional[bool] = False,
        delay: Optional[int] = 0,
        read_chat: Optional[bool] = True
    ) -> str:
        """
        Executa o envio de mensagem de texto via uazapi
        """
        try:
            # Validar token
            if not UAZAPI_TOKEN:
                return json.dumps({
                    "success": False,
                    "error": "Token da uazapi não configurado. Configure UAZAPI_TOKEN no ambiente."
                })

            # Preparar payload
            payload = {
                "number": number,
                "text": text,
                "linkPreview": link_preview,
                "delay": delay,
                "readchat": read_chat
            }

            # Headers de autenticação
            headers = {
                "token": UAZAPI_TOKEN,
                "Content-Type": "application/json"
            }

            # Enviar requisição
            response = requests.post(
                f"{UAZAPI_BASE_URL}/send/text",
                json=payload,
                headers=headers,
                timeout=API_TIMEOUT
            )

            # Processar resposta
            if response.status_code == 200:
                data = response.json()
                return json.dumps({
                    "success": True,
                    "message_id": data.get("messageid", ""),
                    "timestamp": data.get("messageTimestamp", ""),
                    "status": "Mensagem enviada com sucesso",
                    "number": number
                })
            else:
                return json.dumps({
                    "success": False,
                    "error": f"Erro ao enviar mensagem: {response.status_code}",
                    "details": response.text
                })

        except requests.exceptions.Timeout:
            return json.dumps({
                "success": False,
                "error": "Timeout ao enviar mensagem - servidor não respondeu"
            })
        except requests.exceptions.RequestException as e:
            return json.dumps({
                "success": False,
                "error": f"Erro de conexão: {str(e)}"
            })
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": f"Erro inesperado: {str(e)}"
            })


class SendMenuMessageTool(BaseTool):
    """
    Ferramenta para enviar menus interativos via WhatsApp
    
    Use esta ferramenta quando precisar:
    - Apresentar opções ao usuário
    - Criar menus de navegação
    - Oferecer escolhas estruturadas
    
    Tipos de menu: 'button' (botões), 'list' (lista), 'poll' (enquete)
    """
    name: str = "Enviar Menu Interativo WhatsApp"
    description: str = (
        "Envia um menu interativo com opções para o usuário escolher. "
        "Use para apresentar opções estruturadas via botões, listas ou enquetes. "
        "Parâmetros: number, text (mensagem principal), choices (lista de opções), "
        "menu_type (button/list/poll), footer_text, list_button"
    )
    args_schema: Type[BaseModel] = SendMenuMessageInput

    def _run(
        self,
        number: str,
        text: str,
        choices: List[str],
        menu_type: Optional[str] = "button",
        footer_text: Optional[str] = None,
        list_button: Optional[str] = "Ver opções"
    ) -> str:
        """
        Executa o envio de menu interativo via uazapi
        """
        try:
            if not UAZAPI_TOKEN:
                return json.dumps({
                    "success": False,
                    "error": "Token da uazapi não configurado"
                })

            # Preparar payload
            payload = {
                "number": number,
                "type": menu_type,
                "text": text,
                "choices": choices,
                "readchat": True
            }

            # Adicionar campos opcionais
            if footer_text:
                payload["footerText"] = footer_text
            if menu_type == "list":
                payload["listButton"] = list_button

            # Headers
            headers = {
                "token": UAZAPI_TOKEN,
                "Content-Type": "application/json"
            }

            # Enviar requisição
            response = requests.post(
                f"{UAZAPI_BASE_URL}/send/menu",
                json=payload,
                headers=headers,
                timeout=API_TIMEOUT
            )

            if response.status_code == 200:
                data = response.json()
                return json.dumps({
                    "success": True,
                    "message_id": data.get("messageid", ""),
                    "status": f"Menu {menu_type} enviado com sucesso",
                    "number": number
                })
            else:
                return json.dumps({
                    "success": False,
                    "error": f"Erro ao enviar menu: {response.status_code}",
                    "details": response.text
                })

        except Exception as e:
            return json.dumps({
                "success": False,
                "error": f"Erro ao enviar menu: {str(e)}"
            })


class SendMediaMessageTool(BaseTool):
    """
    Ferramenta para enviar mídia via WhatsApp (imagens, documentos, etc)
    
    Use esta ferramenta quando precisar:
    - Enviar relatórios em PDF
    - Compartilhar imagens ou gráficos
    - Enviar documentos importantes
    - Compartilhar áudios ou vídeos
    """
    name: str = "Enviar Mídia WhatsApp"
    description: str = (
        "Envia arquivos de mídia via WhatsApp (imagem, vídeo, documento, áudio). "
        "Use para enviar relatórios, gráficos, documentos PDF, etc. "
        "Parâmetros: number, media_type (image/video/document/audio/ptt), "
        "file (URL ou base64), caption (legenda opcional), doc_name (nome do arquivo)"
    )
    args_schema: Type[BaseModel] = SendMediaMessageInput

    def _run(
        self,
        number: str,
        media_type: str,
        file: str,
        caption: Optional[str] = None,
        doc_name: Optional[str] = None
    ) -> str:
        """
        Executa o envio de mídia via uazapi
        """
        try:
            if not UAZAPI_TOKEN:
                return json.dumps({
                    "success": False,
                    "error": "Token da uazapi não configurado"
                })

            # Preparar payload
            payload = {
                "number": number,
                "type": media_type,
                "file": file,
                "readchat": True
            }

            # Adicionar campos opcionais
            if caption:
                payload["text"] = caption
            if doc_name and media_type == "document":
                payload["docName"] = doc_name

            # Headers
            headers = {
                "token": UAZAPI_TOKEN,
                "Content-Type": "application/json"
            }

            # Enviar requisição
            response = requests.post(
                f"{UAZAPI_BASE_URL}/send/media",
                json=payload,
                headers=headers,
                timeout=API_TIMEOUT
            )

            if response.status_code == 200:
                data = response.json()
                return json.dumps({
                    "success": True,
                    "message_id": data.get("messageid", ""),
                    "status": f"Mídia ({media_type}) enviada com sucesso",
                    "number": number,
                    "file_url": data.get("fileURL", "")
                })
            else:
                return json.dumps({
                    "success": False,
                    "error": f"Erro ao enviar mídia: {response.status_code}",
                    "details": response.text
                })

        except Exception as e:
            return json.dumps({
                "success": False,
                "error": f"Erro ao enviar mídia: {str(e)}"
            })


class GetChatDetailsInput(BaseModel):
    """Input para obter detalhes de um chat/contato."""
    number: str = Field(..., description="Número do chat no formato internacional")


class GetChatDetailsTool(BaseTool):
    """
    Ferramenta para obter detalhes de um chat/contato do WhatsApp
    
    Use esta ferramenta quando precisar:
    - Obter informações sobre um lead/contato
    - Verificar dados salvos do usuário
    - Consultar histórico de interações
    - Obter campos personalizados do lead
    """
    name: str = "Obter Detalhes do Chat WhatsApp"
    description: str = (
        "Obtém informações completas sobre um chat/contato do WhatsApp, incluindo "
        "dados do lead, tags, status, campos personalizados e histórico. "
        "Use para personalizar atendimento baseado em informações do usuário. "
        "Parâmetro: number (número do contato)"
    )
    args_schema: Type[BaseModel] = GetChatDetailsInput

    def _run(self, number: str) -> str:
        """
        Busca detalhes completos de um chat/contato
        """
        try:
            if not UAZAPI_TOKEN:
                return json.dumps({
                    "success": False,
                    "error": "Token da uazapi não configurado"
                })

            # Preparar payload
            payload = {"number": number}

            # Headers
            headers = {
                "token": UAZAPI_TOKEN,
                "Content-Type": "application/json"
            }

            # Buscar detalhes
            response = requests.post(
                f"{UAZAPI_BASE_URL}/chat/details",
                json=payload,
                headers=headers,
                timeout=API_TIMEOUT
            )

            if response.status_code == 200:
                data = response.json()
                
                # Extrair informações relevantes
                chat_info = {
                    "success": True,
                    "wa_name": data.get("wa_name", ""),
                    "wa_contactName": data.get("wa_contactName", ""),
                    "phone": data.get("phone", ""),
                    "lead_name": data.get("lead_name", ""),
                    "lead_email": data.get("lead_email", ""),
                    "lead_status": data.get("lead_status", ""),
                    "lead_tags": data.get("lead_tags", ""),
                    "lead_notes": data.get("lead_notes", ""),
                    "lead_isTicketOpen": data.get("lead_isTicketOpen", False),
                    "wa_isGroup": data.get("wa_isGroup", False),
                    "wa_unreadCount": data.get("wa_unreadCount", 0),
                }
                
                # Adicionar campos personalizados se existirem
                for i in range(1, 21):
                    field_key = f"lead_field{i:02d}"
                    if field_key in data and data[field_key]:
                        chat_info[field_key] = data[field_key]
                
                return json.dumps(chat_info, ensure_ascii=False)
            else:
                return json.dumps({
                    "success": False,
                    "error": f"Erro ao buscar detalhes: {response.status_code}",
                    "details": response.text
                })

        except Exception as e:
            return json.dumps({
                "success": False,
                "error": f"Erro ao buscar detalhes do chat: {str(e)}"
            })


class UpdateLeadInfoInput(BaseModel):
    """Input para atualizar informações de um lead."""
    number: str = Field(..., description="Número do chat/lead")
    lead_name: Optional[str] = Field(None, description="Nome do lead")
    lead_email: Optional[str] = Field(None, description="Email do lead")
    lead_status: Optional[str] = Field(None, description="Status do lead")
    lead_notes: Optional[str] = Field(None, description="Anotações sobre o lead")
    lead_tags: Optional[List[str]] = Field(None, description="Tags do lead")


class UpdateLeadInfoTool(BaseTool):
    """
    Ferramenta para atualizar informações de um lead no CRM
    
    Use esta ferramenta quando precisar:
    - Salvar informações coletadas do usuário
    - Atualizar status do lead
    - Adicionar tags para segmentação
    - Registrar anotações importantes
    """
    name: str = "Atualizar Informações do Lead"
    description: str = (
        "Atualiza informações de um lead no CRM integrado ao WhatsApp. "
        "Use para salvar dados coletados durante a conversa. "
        "Parâmetros: number, lead_name, lead_email, lead_status, lead_notes, lead_tags"
    )
    args_schema: Type[BaseModel] = UpdateLeadInfoInput

    def _run(
        self,
        number: str,
        lead_name: Optional[str] = None,
        lead_email: Optional[str] = None,
        lead_status: Optional[str] = None,
        lead_notes: Optional[str] = None,
        lead_tags: Optional[List[str]] = None
    ) -> str:
        """
        Atualiza informações do lead
        """
        try:
            if not UAZAPI_TOKEN:
                return json.dumps({
                    "success": False,
                    "error": "Token da uazapi não configurado"
                })

            # Preparar payload com campos a atualizar
            payload = {"id": number}
            
            if lead_name is not None:
                payload["lead_name"] = lead_name
            if lead_email is not None:
                payload["lead_email"] = lead_email
            if lead_status is not None:
                payload["lead_status"] = lead_status
            if lead_notes is not None:
                payload["lead_notes"] = lead_notes
            if lead_tags is not None:
                payload["lead_tags"] = lead_tags

            # Headers
            headers = {
                "token": UAZAPI_TOKEN,
                "Content-Type": "application/json"
            }

            # Atualizar lead
            response = requests.post(
                f"{UAZAPI_BASE_URL}/chat/editLead",
                json=payload,
                headers=headers,
                timeout=API_TIMEOUT
            )

            if response.status_code == 200:
                return json.dumps({
                    "success": True,
                    "status": "Lead atualizado com sucesso",
                    "updated_fields": list(payload.keys())
                })
            else:
                return json.dumps({
                    "success": False,
                    "error": f"Erro ao atualizar lead: {response.status_code}",
                    "details": response.text
                })

        except Exception as e:
            return json.dumps({
                "success": False,
                "error": f"Erro ao atualizar lead: {str(e)}"
            })


class FormatResponseInput(BaseModel):
    """Input para formatar resposta de agente."""
    agent_response: str = Field(..., description="Resposta bruta do agente especialista")
    format_type: Optional[str] = Field("text", description="Tipo de formatação: 'text', 'structured', 'menu'")
    add_greeting: Optional[bool] = Field(True, description="Adicionar saudação personalizada")
    add_signature: Optional[bool] = Field(True, description="Adicionar assinatura do Falachefe")


class FormatResponseTool(BaseTool):
    """
    Ferramenta para formatar respostas de agentes para envio via WhatsApp
    
    Use esta ferramenta quando precisar:
    - Formatar respostas técnicas para linguagem acessível
    - Adicionar saudações e assinaturas
    - Estruturar informações de forma clara
    - Preparar conteúdo para envio via WhatsApp
    """
    name: str = "Formatar Resposta para WhatsApp"
    description: str = (
        "Formata a resposta de um agente especialista para envio via WhatsApp. "
        "Adiciona saudações, estrutura o conteúdo e inclui assinatura profissional. "
        "Parâmetros: agent_response, format_type (text/structured/menu), "
        "add_greeting, add_signature"
    )
    args_schema: Type[BaseModel] = FormatResponseInput

    def _run(
        self,
        agent_response: str,
        format_type: Optional[str] = "text",
        add_greeting: Optional[bool] = True,
        add_signature: Optional[bool] = True
    ) -> str:
        """
        Formata a resposta do agente para WhatsApp
        """
        try:
            formatted_text = ""
            
            # Adicionar saudação se solicitado
            if add_greeting:
                hour = datetime.now().hour
                if 5 <= hour < 12:
                    greeting = "☀️ Bom dia!"
                elif 12 <= hour < 18:
                    greeting = "☀️ Boa tarde!"
                else:
                    greeting = "🌙 Boa noite!"
                
                formatted_text += f"{greeting}\n\n"
            
            # Formatar conteúdo baseado no tipo
            if format_type == "structured":
                # Adicionar estrutura clara com emojis e separadores
                formatted_text += "📋 *CONSULTORIA FALACHEFE*\n"
                formatted_text += "─" * 30 + "\n\n"
                formatted_text += agent_response
                formatted_text += "\n\n" + "─" * 30
            elif format_type == "menu":
                # Formato para menus e listas
                formatted_text += agent_response
            else:
                # Texto simples e limpo
                formatted_text += agent_response
            
            # Adicionar assinatura se solicitado
            if add_signature:
                formatted_text += "\n\n---\n"
                formatted_text += "🤝 *Falachefe Consultoria*\n"
                formatted_text += "💼 Especialistas em Gestão para PMEs\n"
                formatted_text += "📱 Atendimento via WhatsApp"
            
            return json.dumps({
                "success": True,
                "formatted_text": formatted_text,
                "char_count": len(formatted_text),
                "format_type": format_type
            }, ensure_ascii=False)

        except Exception as e:
            return json.dumps({
                "success": False,
                "error": f"Erro ao formatar resposta: {str(e)}",
                "original_response": agent_response
            })


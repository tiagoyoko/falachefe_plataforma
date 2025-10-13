"""
Ferramentas para consulta e edição de perfil do usuário
Permite que agentes acessem e modifiquem dados do usuário e empresa
"""

from crewai_tools import BaseTool
from typing import Type, Optional, Dict, Any
from pydantic import BaseModel, Field
import os
import requests


class GetUserProfileInput(BaseModel):
    """Input para GetUserProfileTool"""
    user_id: str = Field(..., description="ID do usuário (UUID)")


class GetUserProfileTool(BaseTool):
    name: str = "Consultar Perfil do Usuário"
    description: str = (
        "Busca o perfil completo do usuário incluindo: nome, sobrenome, telefone, "
        "email, nome da empresa, setor, tamanho da empresa, cargo. "
        "Use quando precisar personalizar a conversa com dados do usuário."
    )
    args_schema: Type[BaseModel] = GetUserProfileInput

    def _run(self, user_id: str) -> str:
        """Busca perfil do usuário no Supabase"""
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not supabase_url or not supabase_key:
                return "❌ Erro: Supabase não configurado"
            
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json"
            }
            
            # Buscar dados do user_onboarding
            response = requests.get(
                f"{supabase_url}/rest/v1/user_onboarding",
                params={"user_id": f"eq.{user_id}", "select": "*"},
                headers=headers
            )
            
            if response.status_code != 200:
                return f"❌ Erro ao buscar perfil: {response.status_code}"
            
            data = response.json()
            if not data or len(data) == 0:
                return "❌ Usuário não encontrado"
            
            user = data[0]
            
            # Formatar resposta
            profile = f"""
✅ PERFIL DO USUÁRIO:

👤 Nome: {user.get('first_name', '')} {user.get('last_name', '')}
📧 Email: {user.get('email', 'não informado')}
📱 WhatsApp: {user.get('whatsapp_phone', 'não informado')}

🏢 EMPRESA:
- Nome: {user.get('company_name', 'não informado')}
- Setor: {user.get('industry', 'não informado')}
- Tamanho: {user.get('company_size', 'não informado')}
- Cargo do usuário: {user.get('position', 'não informado')}

📊 STATUS:
- Onboarding completo: {'Sim' if user.get('is_completed') else 'Não'}
- Cadastrado em: {user.get('created_at', 'não informado')}
"""
            return profile.strip()
            
        except Exception as e:
            return f"❌ Erro ao buscar perfil: {str(e)}"


class GetCompanyDataInput(BaseModel):
    """Input para GetCompanyDataTool"""
    company_id: str = Field(..., description="ID da empresa (UUID)")


class GetCompanyDataTool(BaseTool):
    name: str = "Consultar Dados da Empresa"
    description: str = (
        "Busca dados completos da empresa: nome, domínio, plano de assinatura, "
        "configurações, status ativo. Use quando precisar de informações específicas da empresa."
    )
    args_schema: Type[BaseModel] = GetCompanyDataInput

    def _run(self, company_id: str) -> str:
        """Busca dados da empresa no Supabase"""
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not supabase_url or not supabase_key:
                return "❌ Erro: Supabase não configurado"
            
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json"
            }
            
            # Buscar dados da empresa
            response = requests.get(
                f"{supabase_url}/rest/v1/companies",
                params={"id": f"eq.{company_id}", "select": "*"},
                headers=headers
            )
            
            if response.status_code != 200:
                return f"❌ Erro ao buscar empresa: {response.status_code}"
            
            data = response.json()
            if not data or len(data) == 0:
                return "❌ Empresa não encontrada"
            
            company = data[0]
            settings = company.get('settings', {}) or {}
            
            # Formatar resposta
            company_data = f"""
✅ DADOS DA EMPRESA:

🏢 Nome: {company.get('name', 'não informado')}
🌐 Domínio: {company.get('domain', 'não informado')}
📦 Plano: {company.get('subscriptionPlan', 'não informado')}
✅ Status: {'Ativa' if company.get('isActive') else 'Inativa'}

⚙️ CONFIGURAÇÕES:
{self._format_settings(settings)}

📅 Criada em: {company.get('created_at', 'não informado')}
"""
            return company_data.strip()
            
        except Exception as e:
            return f"❌ Erro ao buscar empresa: {str(e)}"
    
    def _format_settings(self, settings: dict) -> str:
        """Formata configurações da empresa"""
        if not settings:
            return "- Nenhuma configuração definida"
        
        lines = []
        for key, value in settings.items():
            lines.append(f"- {key}: {value}")
        
        return "\n".join(lines) if lines else "- Nenhuma configuração definida"


class UpdateUserPreferencesInput(BaseModel):
    """Input para UpdateUserPreferencesTool"""
    user_id: str = Field(..., description="ID do usuário (UUID)")
    preferences: Dict[str, Any] = Field(..., description="Dicionário com preferências a atualizar")


class UpdateUserPreferencesTool(BaseTool):
    name: str = "Atualizar Preferências do Usuário"
    description: str = (
        "Atualiza preferências do usuário (ex: horário preferido de contato, "
        "notificações, idioma, etc). Recebe um dicionário com as preferências. "
        "Use quando o usuário pedir para alterar suas preferências."
    )
    args_schema: Type[BaseModel] = UpdateUserPreferencesInput

    def _run(self, user_id: str, preferences: Dict[str, Any]) -> str:
        """Atualiza preferências do usuário"""
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not supabase_url or not supabase_key:
                return "❌ Erro: Supabase não configurado"
            
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            # Buscar configurações atuais
            get_response = requests.get(
                f"{supabase_url}/rest/v1/user_onboarding",
                params={"user_id": f"eq.{user_id}", "select": "preferences"},
                headers=headers
            )
            
            current_prefs = {}
            if get_response.status_code == 200 and get_response.json():
                current_prefs = get_response.json()[0].get('preferences', {}) or {}
            
            # Mesclar preferências
            updated_prefs = {**current_prefs, **preferences}
            
            # Atualizar no banco
            response = requests.patch(
                f"{supabase_url}/rest/v1/user_onboarding",
                params={"user_id": f"eq.{user_id}"},
                json={"preferences": updated_prefs},
                headers=headers
            )
            
            if response.status_code in [200, 204]:
                prefs_str = "\n".join([f"- {k}: {v}" for k, v in preferences.items()])
                return f"✅ Preferências atualizadas com sucesso:\n{prefs_str}"
            else:
                return f"❌ Erro ao atualizar preferências: {response.status_code} - {response.text}"
            
        except Exception as e:
            return f"❌ Erro ao atualizar preferências: {str(e)}"


class UpdateUserProfileInput(BaseModel):
    """Input para UpdateUserProfileTool"""
    user_id: str = Field(..., description="ID do usuário (UUID)")
    updates: Dict[str, Any] = Field(
        ..., 
        description="Dicionário com campos a atualizar (ex: first_name, last_name, email, position)"
    )


class UpdateUserProfileTool(BaseTool):
    name: str = "Atualizar Perfil do Usuário"
    description: str = (
        "Atualiza informações do perfil do usuário como nome, sobrenome, email, "
        "cargo, telefone. Use quando o usuário solicitar correção ou atualização de dados pessoais."
    )
    args_schema: Type[BaseModel] = UpdateUserProfileInput

    def _run(self, user_id: str, updates: Dict[str, Any]) -> str:
        """Atualiza perfil do usuário"""
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not supabase_url or not supabase_key:
                return "❌ Erro: Supabase não configurado"
            
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            # Campos permitidos para atualização
            allowed_fields = ['first_name', 'last_name', 'email', 'whatsapp_phone', 'position']
            filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
            
            if not filtered_updates:
                return "❌ Nenhum campo válido para atualizar"
            
            # Atualizar no banco
            response = requests.patch(
                f"{supabase_url}/rest/v1/user_onboarding",
                params={"user_id": f"eq.{user_id}"},
                json=filtered_updates,
                headers=headers
            )
            
            if response.status_code in [200, 204]:
                updates_str = "\n".join([f"- {k}: {v}" for k, v in filtered_updates.items()])
                return f"✅ Perfil atualizado com sucesso:\n{updates_str}"
            else:
                return f"❌ Erro ao atualizar perfil: {response.status_code} - {response.text}"
            
        except Exception as e:
            return f"❌ Erro ao atualizar perfil: {str(e)}"


class UpdateCompanyDataInput(BaseModel):
    """Input para UpdateCompanyDataTool"""
    company_id: str = Field(..., description="ID da empresa (UUID)")
    updates: Dict[str, Any] = Field(
        ..., 
        description="Dicionário com campos a atualizar (ex: name, settings)"
    )


class UpdateCompanyDataTool(BaseTool):
    name: str = "Atualizar Dados da Empresa"
    description: str = (
        "Atualiza informações da empresa como nome, configurações específicas. "
        "Use quando o usuário solicitar alteração de dados da empresa."
    )
    args_schema: Type[BaseModel] = UpdateCompanyDataInput

    def _run(self, company_id: str, updates: Dict[str, Any]) -> str:
        """Atualiza dados da empresa"""
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not supabase_url or not supabase_key:
                return "❌ Erro: Supabase não configurado"
            
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            # Campos permitidos para atualização
            allowed_fields = ['name', 'settings']
            filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
            
            if not filtered_updates:
                return "❌ Nenhum campo válido para atualizar"
            
            # Atualizar no banco
            response = requests.patch(
                f"{supabase_url}/rest/v1/companies",
                params={"id": f"eq.{company_id}"},
                json=filtered_updates,
                headers=headers
            )
            
            if response.status_code in [200, 204]:
                updates_str = "\n".join([f"- {k}: {v}" for k, v in filtered_updates.items()])
                return f"✅ Dados da empresa atualizados:\n{updates_str}"
            else:
                return f"❌ Erro ao atualizar empresa: {response.status_code} - {response.text}"
            
        except Exception as e:
            return f"❌ Erro ao atualizar empresa: {str(e)}"


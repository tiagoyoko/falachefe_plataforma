# Dockerfile para API CrewAI Flask
FROM python:3.12-slim

# Metadados
LABEL maintainer="Falachefe <contato@falachefe.app.br>"
LABEL description="API CrewAI para processamento de mensagens WhatsApp"

# Variáveis de ambiente para Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Criar usuário não-root para segurança
RUN groupadd -r crewai && useradd -r -g crewai crewai

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Diretório de trabalho
WORKDIR /app

# Copiar apenas requirements primeiro (cache layer)
COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt

# Copiar código da aplicação
COPY . .

# Mudar ownership para usuário não-root
RUN chown -R crewai:crewai /app

# Trocar para usuário não-root
USER crewai

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando para rodar a aplicação
CMD ["gunicorn", "api_server:app", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--threads", "4", \
     "--timeout", "120", \
     "--worker-class", "sync", \
     "--worker-tmp-dir", "/dev/shm", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]



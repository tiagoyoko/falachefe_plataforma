import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

/**
 * Endpoint para processar mensagens com CrewAI
 * 
 * Chama o script Python webhook_processor.py que orquestra os agentes
 * e retorna uma resposta estruturada.
 * 
 * Fluxo:
 * 1. Recebe mensagem + contexto do usuário
 * 2. Chama script Python via child_process
 * 3. Script executa CrewAI Orchestrated Crew
 * 4. Retorna resposta do agente apropriado
 */
export async function POST(request: NextRequest) {
  try {
    const { message, userId, phoneNumber, context } = await request.json();

    // Validações básicas
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'message is required and must be a string' 
        },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'userId is required and must be a string' 
        },
        { status: 400 }
      );
    }

    console.log('🤖 Processing message with CrewAI:', {
      messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      userId,
      phoneNumber,
      hasContext: !!context
    });

    // Executar CrewAI Python
    const result = await executeCrewAIPython({
      user_message: message,
      user_id: userId,
      phone_number: phoneNumber || '',
      context: context || {}
    });

    console.log('✅ CrewAI processing completed:', {
      success: result.success,
      responseLength: result.response?.length || 0,
      processingTime: result.metadata?.processing_time_ms || 0
    });

    return NextResponse.json({
      success: result.success,
      response: result.response,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('❌ Error processing with CrewAI:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        response: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente em instantes.'
      },
      { status: 500 }
    );
  }
}

/**
 * Executa script Python do CrewAI
 * 
 * @param inputs - Dados para o CrewAI processar
 * @returns Resposta do CrewAI
 */
async function executeCrewAIPython(inputs: {
  user_message: string;
  user_id: string;
  phone_number: string;
  context?: any;
}): Promise<{
  success: boolean;
  response: string;
  metadata?: any;
}> {
  
  return new Promise((resolve, reject) => {
    const crewPath = path.join(process.cwd(), 'crewai-projects', 'falachefe_crew');
    const scriptPath = path.join(crewPath, 'webhook_processor.py');
    
    console.log('🐍 Executing Python script:', {
      scriptPath,
      crewPath,
      inputs: { ...inputs, user_message: inputs.user_message.substring(0, 50) + '...' }
    });

    // Verificar se script existe
    const fs = require('fs');
    if (!fs.existsSync(scriptPath)) {
      reject(new Error(`Python script not found: ${scriptPath}`));
      return;
    }

    // Determinar comando Python (tentar python3, depois python)
    const pythonCmd = process.env.PYTHON_PATH || 'python3';
    
    // Executar Python
    const python = spawn(pythonCmd, [scriptPath], {
      cwd: crewPath,
      env: {
        ...process.env,
        PYTHONPATH: path.join(crewPath, 'src'),
        PYTHONUNBUFFERED: '1', // Para logs em tempo real
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    // Enviar inputs via stdin
    python.stdin.write(JSON.stringify(inputs));
    python.stdin.end();

    // Capturar stdout
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Capturar stderr (logs do Python)
    python.stderr.on('data', (data) => {
      const logMessage = data.toString();
      stderr += logMessage;
      // Logar stderr em tempo real para debugging
      console.log('[Python]', logMessage.trim());
    });

    // Timeout de 60 segundos
    const timeout = setTimeout(() => {
      python.kill('SIGTERM');
      reject(new Error('CrewAI execution timeout (60s)'));
    }, 60000);

    python.on('error', (error) => {
      clearTimeout(timeout);
      console.error('❌ Python process error:', error);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });

    python.on('close', (code) => {
      clearTimeout(timeout);
      
      console.log('🐍 Python process exited:', {
        code,
        stdoutLength: stdout.length,
        stderrLength: stderr.length
      });

      if (code !== 0) {
        console.error('❌ Python script failed:', {
          code,
          stderr: stderr.substring(0, 500)
        });
        
        reject(new Error(
          `Python script exited with code ${code}. ` +
          `Error: ${stderr.substring(0, 200)}`
        ));
        return;
      }

      // Parse resultado do stdout
      try {
        const result = JSON.parse(stdout);
        
        if (!result.success) {
          console.warn('⚠️ CrewAI returned success=false:', result.metadata?.error);
        }
        
        resolve(result);
      } catch (error) {
        console.error('❌ Failed to parse CrewAI response:', {
          stdout: stdout.substring(0, 200),
          error
        });
        
        reject(new Error(
          `Failed to parse CrewAI response. ` +
          `Output: ${stdout.substring(0, 100)}`
        ));
      }
    });
  });
}

/**
 * Health check
 */
export async function GET() {
  const crewPath = path.join(process.cwd(), 'crewai-projects', 'falachefe_crew');
  const scriptPath = path.join(crewPath, 'webhook_processor.py');
  const fs = require('fs');
  
  return NextResponse.json({
    status: 'ok',
    service: 'crewai-bridge',
    timestamp: new Date().toISOString(),
    pythonScriptExists: fs.existsSync(scriptPath),
    scriptPath,
    pythonCommand: process.env.PYTHON_PATH || 'python3'
  });
}


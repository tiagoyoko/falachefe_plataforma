/**
 * Python CrewAI Bridge
 * 
 * This module provides a bridge between the Node.js application and the Python CrewAI system.
 * It handles communication, data serialization, and result processing.
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface CrewAIRequest {
  taskType: string;
  userQuery?: string;
  userId: string;
  context?: Record<string, any>;
  expenseData?: string;
  timePeriod?: string;
}

export interface CrewAIResponse {
  success: boolean;
  result?: string;
  error?: string;
  executionTime?: number;
  taskType: string;
  userId: string;
}

export class PythonCrewAIBridge {
  private pythonPath: string;
  private projectPath: string;
  private isAvailable: boolean = false;

  constructor() {
    this.pythonPath = process.env.CREWAI_PYTHON_PATH || 'python3';
    this.projectPath = process.env.CREWAI_PROJECT_PATH || path.join(process.cwd(), 'crewai-projects', 'falachefe-crew');
    
    this.checkAvailability();
  }

  /**
   * Check if Python and CrewAI are available
   */
  private async checkAvailability(): Promise<void> {
    try {
      const result = await this.executePythonScript('check_availability.py');
      this.isAvailable = result.success;
    } catch (error) {
      console.warn('CrewAI Python bridge not available:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Execute a Python script and return the result
   */
  private async executePythonScript(scriptName: string, args: string[] = []): Promise<CrewAIResponse> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.projectPath, scriptName);
      
      if (!fs.existsSync(scriptPath)) {
        reject(new Error(`Python script not found: ${scriptPath}`));
        return;
      }

      const pythonProcess = spawn(this.pythonPath, [scriptPath, ...args], {
        cwd: this.projectPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            resolve({
              success: false,
              error: `Failed to parse Python output: ${stdout}`,
              taskType: 'unknown',
              userId: 'unknown'
            });
          }
        } else {
          resolve({
            success: false,
            error: stderr || `Python script exited with code ${code}`,
            taskType: 'unknown',
            userId: 'unknown'
          });
        }
      });

      pythonProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Execute financial analysis
   */
  async executeFinancialAnalysis(userQuery: string, userId: string, context?: Record<string, any>): Promise<CrewAIResponse> {
    const request: CrewAIRequest = {
      taskType: 'financial_analysis',
      userQuery,
      userId,
      context
    };

    return this.executeCrewAITask(request);
  }

  /**
   * Execute expense management
   */
  async executeExpenseManagement(expenseData: string, userId: string): Promise<CrewAIResponse> {
    const request: CrewAIRequest = {
      taskType: 'expense_management',
      expenseData,
      userId
    };

    return this.executeCrewAITask(request);
  }

  /**
   * Execute cash flow analysis
   */
  async executeCashFlowAnalysis(userId: string, timePeriod: string = 'monthly'): Promise<CrewAIResponse> {
    const request: CrewAIRequest = {
      taskType: 'cashflow_analysis',
      userId,
      timePeriod
    };

    return this.executeCrewAITask(request);
  }

  /**
   * Execute user support
   */
  async executeUserSupport(userQuestion: string, userId: string): Promise<CrewAIResponse> {
    const request: CrewAIRequest = {
      taskType: 'user_support',
      userQuery: userQuestion,
      userId
    };

    return this.executeCrewAITask(request);
  }

  /**
   * Execute comprehensive financial review
   */
  async executeComprehensiveReview(userId: string): Promise<CrewAIResponse> {
    const request: CrewAIRequest = {
      taskType: 'comprehensive_review',
      userId
    };

    return this.executeCrewAITask(request);
  }

  /**
   * Execute a CrewAI task
   */
  private async executeCrewAITask(request: CrewAIRequest): Promise<CrewAIResponse> {
    const startTime = Date.now();
    
    try {
      // Create temporary request file
      const requestFile = path.join(this.projectPath, 'temp_request.json');
      fs.writeFileSync(requestFile, JSON.stringify(request, null, 2));

      // Execute Python script
      const result = await this.executePythonScript('execute_task.py', [requestFile]);

      // Clean up temporary file
      if (fs.existsSync(requestFile)) {
        fs.unlinkSync(requestFile);
      }

      const executionTime = Date.now() - startTime;
      
      return {
        ...result,
        executionTime,
        taskType: request.taskType,
        userId: request.userId
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        taskType: request.taskType,
        userId: request.userId
      };
    }
  }

  /**
   * Check if the bridge is available
   */
  isBridgeAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Get bridge status
   */
  async getStatus(): Promise<{
    available: boolean;
    pythonPath: string;
    projectPath: string;
    version?: string;
  }> {
    try {
      const result = await this.executePythonScript('get_status.py');
      return {
        available: this.isAvailable,
        pythonPath: this.pythonPath,
        projectPath: this.projectPath,
        version: result.result
      };
    } catch (error) {
      return {
        available: false,
        pythonPath: this.pythonPath,
        projectPath: this.projectPath
      };
    }
  }
}

// Export singleton instance
export const crewAIBridge = new PythonCrewAIBridge();







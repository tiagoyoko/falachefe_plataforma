import { Resend } from 'resend';

// Inicializar cliente Resend (permitir undefined para testes)
const resend = new Resend(process.env.RESEND_API_KEY || 'test-key');

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  url: string;
  token: string;
}

export interface PasswordResetEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  url: string;
  token: string;
}

export interface WelcomeEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  loginUrl: string;
}

class EmailService {
  private fromEmail: string;
  private appName: string;
  private appUrl: string;

  constructor() {
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@falachefe.com';
    this.appName = process.env.APP_NAME || 'FalaChefe';
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Enviar email de verificação de conta
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    try {
      const { user, url } = data;
      
      const emailTemplate = this.getVerificationEmailTemplate({
        userName: user.name,
        verificationUrl: url,
        appName: this.appName,
        appUrl: this.appUrl,
      });

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [user.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log(`✅ Email de verificação enviado para ${user.email}:`, result);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de verificação:', error);
      return false;
    }
  }

  /**
   * Enviar email de redefinição de senha
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    try {
      const { user, url } = data;
      
      const emailTemplate = this.getPasswordResetEmailTemplate({
        userName: user.name,
        resetUrl: url,
        appName: this.appName,
        appUrl: this.appUrl,
      });

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [user.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log(`✅ Email de redefinição de senha enviado para ${user.email}:`, result);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de redefinição de senha:', error);
      return false;
    }
  }

  /**
   * Enviar email de boas-vindas
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const { user, loginUrl } = data;
      
      const emailTemplate = this.getWelcomeEmailTemplate({
        userName: user.name,
        loginUrl,
        appName: this.appName,
        appUrl: this.appUrl,
      });

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [user.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log(`✅ Email de boas-vindas enviado para ${user.email}:`, result);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de boas-vindas:', error);
      return false;
    }
  }

  /**
   * Template para email de verificação
   */
  private getVerificationEmailTemplate(data: {
    userName: string;
    verificationUrl: string;
    appName: string;
    appUrl: string;
  }) {
    const { userName, verificationUrl, appName, appUrl } = data;

    return {
      subject: `Verifique sua conta - ${appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifique sua conta - ${appName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${appName}</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Plataforma de Chat Multagente IA</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Olá, ${userName}!</h2>
            
            <p>Obrigado por se cadastrar na ${appName}. Para ativar sua conta e começar a usar nossa plataforma, clique no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Verificar Conta
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p>Este link expira em 24 horas por motivos de segurança.</p>
              <p>Se você não criou uma conta na ${appName}, pode ignorar este email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Olá, ${userName}!
        
        Obrigado por se cadastrar na ${appName}. Para ativar sua conta, acesse o link abaixo:
        
        ${verificationUrl}
        
        Este link expira em 24 horas por motivos de segurança.
        
        Se você não criou uma conta na ${appName}, pode ignorar este email.
        
        Atenciosamente,
        Equipe ${appName}
      `,
    };
  }

  /**
   * Template para email de redefinição de senha
   */
  private getPasswordResetEmailTemplate(data: {
    userName: string;
    resetUrl: string;
    appName: string;
    appUrl: string;
  }) {
    const { userName, resetUrl, appName, appUrl } = data;

    return {
      subject: `Redefinir senha - ${appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir senha - ${appName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${appName}</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Redefinição de Senha</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Olá, ${userName}!</h2>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta na ${appName}. Para criar uma nova senha, clique no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Redefinir Senha
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${resetUrl}" style="color: #e74c3c; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p><strong>Importante:</strong> Este link expira em 1 hora por motivos de segurança.</p>
              <p>Se você não solicitou a redefinição de senha, ignore este email. Sua conta permanece segura.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Olá, ${userName}!
        
        Recebemos uma solicitação para redefinir a senha da sua conta na ${appName}. 
        Para criar uma nova senha, acesse o link abaixo:
        
        ${resetUrl}
        
        IMPORTANTE: Este link expira em 1 hora por motivos de segurança.
        
        Se você não solicitou a redefinição de senha, ignore este email. Sua conta permanece segura.
        
        Atenciosamente,
        Equipe ${appName}
      `,
    };
  }

  /**
   * Template para email de boas-vindas
   */
  private getWelcomeEmailTemplate(data: {
    userName: string;
    loginUrl: string;
    appName: string;
    appUrl: string;
  }) {
    const { userName, loginUrl, appName, appUrl } = data;

    return {
      subject: `Bem-vindo(a) à ${appName}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo(a) - ${appName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo(a) à ${appName}!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Sua conta foi criada com sucesso</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Olá, ${userName}!</h2>
            
            <p>Parabéns! Sua conta na ${appName} foi criada com sucesso. Agora você pode:</p>
            
            <ul style="color: #555; line-height: 1.8;">
              <li>🤖 Configurar agentes de IA especializados</li>
              <li>💬 Gerenciar conversas via WhatsApp</li>
              <li>📊 Acompanhar métricas e relatórios</li>
              <li>⚙️ Personalizar respostas e fluxos</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Acessar Minha Conta
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p>Precisa de ajuda? Entre em contato conosco através do suporte.</p>
              <p>Obrigado por escolher a ${appName}!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Olá, ${userName}!
        
        Parabéns! Sua conta na ${appName} foi criada com sucesso.
        
        Agora você pode:
        • Configurar agentes de IA especializados
        • Gerenciar conversas via WhatsApp
        • Acompanhar métricas e relatórios
        • Personalizar respostas e fluxos
        
        Acesse sua conta: ${loginUrl}
        
        Precisa de ajuda? Entre em contato conosco através do suporte.
        
        Obrigado por escolher a ${appName}!
        
        Atenciosamente,
        Equipe ${appName}
      `,
    };
  }

  /**
   * Verificar se o serviço está configurado corretamente
   */
  async isConfigured(): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY não configurada');
        return false;
      }
      
      // Em modo de teste, apenas verificar se a chave existe
      if (process.env.NODE_ENV === 'test' || process.env.RESEND_API_KEY === 'test-key') {
        console.log('🧪 Modo de teste - não enviando email real');
        return true;
      }
      
      // Testar conexão com Resend (apenas em produção)
      const result = await resend.emails.send({
        from: this.fromEmail,
        to: ['test@example.com'],
        subject: 'Teste de configuração',
        html: '<p>Teste</p>',
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro na configuração do serviço de email:', error);
      return false;
    }
  }
}

// Exportar instância singleton
export const emailService = new EmailService();

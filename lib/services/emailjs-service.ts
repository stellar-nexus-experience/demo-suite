import emailjs from '@emailjs/browser';
import clientEnv from '../utils/client-env';

// EmailJS configuration
const EMAILJS_CONFIG = {
  serviceId: clientEnv.NEXT_PUBLIC_EMAILJS_SERVICE_ID || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  templateId: clientEnv.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  publicKey: clientEnv.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
};

export interface ReferralInvitationData {
  user_email: string;
  referral_code: string;
  referral_link: string;
  referrer_name: string;
  personal_message?: string;
}

export class EmailJSService {
  private static instance: EmailJSService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): EmailJSService {
    if (!EmailJSService.instance) {
      EmailJSService.instance = new EmailJSService();
    }
    return EmailJSService.instance;
  }

  private initialize(): void {
    if (!this.isInitialized && EMAILJS_CONFIG.publicKey) {
      emailjs.init(EMAILJS_CONFIG.publicKey);
      this.isInitialized = true;
    }
  }

  public async sendReferralInvitation(data: ReferralInvitationData): Promise<boolean> {
    try {
      // Validate required configuration first
      if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.publicKey) {
        const missing = [];
        if (!EMAILJS_CONFIG.serviceId) missing.push('SERVICE_ID');
        if (!EMAILJS_CONFIG.templateId) missing.push('TEMPLATE_ID');
        if (!EMAILJS_CONFIG.publicKey) missing.push('PUBLIC_KEY');
        throw new Error(`EmailJS configuration is missing: ${missing.join(', ')}. Please check your environment variables.`);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.user_email)) {
        throw new Error('Invalid email address format.');
      }

      // Initialize EmailJS
      this.initialize();

      // Prepare template parameters
      const templateParams = {
        user_email: data.user_email,
        referral_code: data.referral_code,
        referral_link: data.referral_link,
        referrer_name: data.referrer_name,
        personal_message: data.personal_message || 'Join me on this amazing Web3 journey!',
      };

      // Send email with timeout
      const sendPromise = emailjs.send(
        EMAILJS_CONFIG.serviceId!,
        EMAILJS_CONFIG.templateId!,
        templateParams
      );

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email sending timed out after 30 seconds')), 30000);
      });

      const response = await Promise.race([sendPromise, timeoutPromise]) as any;

      return response.status === 200;
    } catch (error: any) {
      console.error('EmailJS error details:', {
        error,
        message: error?.message,
        text: error?.text,
        status: error?.status,
        code: error?.code,
        config: {
          hasServiceId: !!EMAILJS_CONFIG.serviceId,
          hasTemplateId: !!EMAILJS_CONFIG.templateId,
          hasPublicKey: !!EMAILJS_CONFIG.publicKey,
        }
      });
      
      // Provide more detailed error information
      let errorMessage = 'Failed to send referral invitation. Please try again.';
      
      if (error?.text) {
        // EmailJS specific error
        errorMessage = `EmailJS error: ${error.text}`;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status === 0 || error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and EmailJS configuration. If the problem persists, verify your EmailJS public key is correct.';
      } else if (error?.code === 'NETWORK_ERROR' || error?.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      throw new Error(errorMessage);
    }
  }

  public async sendTestEmail(testEmail: string): Promise<boolean> {
    try {
      this.initialize();

      if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.publicKey) {
        throw new Error('EmailJS configuration is missing. Please check your environment variables.');
      }

      const templateParams = {
        user_email: testEmail,
        referral_code: 'TEST123',
        referral_link: 'https://stellar-nexus-experience.vercel.app/?ref=TEST123',
        referrer_name: 'Test User',
        personal_message: 'This is a test email to verify EmailJS configuration.',
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      return response.status === 200;
    } catch (error) {
      console.error('EmailJS test error:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to send test email. Please check your EmailJS configuration.'
      );
    }
  }

  public isConfigured(): boolean {
    return !!(
      EMAILJS_CONFIG.serviceId &&
      EMAILJS_CONFIG.templateId &&
      EMAILJS_CONFIG.publicKey
    );
  }

  public getConfigurationStatus(): {
    serviceId: boolean;
    templateId: boolean;
    publicKey: boolean;
    fullyConfigured: boolean;
  } {
    return {
      serviceId: !!EMAILJS_CONFIG.serviceId,
      templateId: !!EMAILJS_CONFIG.templateId,
      publicKey: !!EMAILJS_CONFIG.publicKey,
      fullyConfigured: this.isConfigured(),
    };
  }
}

// Export singleton instance
export const emailJSService = EmailJSService.getInstance();

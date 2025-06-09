import { supabase } from './supabase';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export class EmailService {
  private static instance: EmailService;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendMessage(messageId: string, recipientEmail: string, recipientName: string): Promise<boolean> {
    try {
      console.log('🚀 Starting message delivery email process...', { messageId, recipientEmail });
      
      // Fetch message details with sender info
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_user_id_fkey(full_name, email)
        `)
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        console.error('❌ Error fetching message:', messageError);
        return false;
      }

      console.log('📧 Message data retrieved:', {
        title: message.title,
        senderName: message.profiles?.full_name,
        senderEmail: message.profiles?.email
      });

      // Create a secure link for viewing the message
      const messageLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/message/${messageId}`;

      console.log('🔗 Message link created:', messageLink);

      // Send email using Supabase Edge Function
      console.log('📤 Calling send-message-delivery function...');
      
      const { data, error } = await supabase.functions.invoke('send-message-delivery', {
        body: {
          to: recipientEmail,
          recipientName: recipientName,
          senderName: message.profiles?.full_name || 'Someone special',
          messageTitle: message.title,
          messageLink: messageLink,
          messageId: messageId,
          hasPin: !!message.pin_hash,
          deliveryReason: message.trigger_type === 'inactivity' ? 'inactivity detected' : 'scheduled delivery'
        }
      });

      console.log('📬 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Error from edge function:', error);
        return false;
      }

      // Update message status to delivered
      const { error: updateError } = await supabase
        .from('messages')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('❌ Error updating message status:', updateError);
      }

      // Log the delivery
      await supabase
        .from('activity_logs')
        .insert({
          user_id: message.user_id,
          action: 'message_delivered',
          details: {
            message_id: messageId,
            recipient_email: recipientEmail,
            recipient_name: recipientName,
            delivery_method: 'email',
            email_id: data?.id
          }
        });

      console.log('✅ Message delivered successfully:', { messageId, recipientEmail, emailId: data?.id });
      return true;
    } catch (error) {
      console.error('💥 Error in sendMessage:', error);
      return false;
    }
  }

  async sendInactivityWarning(userId: string, userEmail: string, userName: string, daysInactive: number, thresholdDays: number = 30): Promise<boolean> {
    try {
      console.log('🚀 Starting inactivity warning email...', { userId, userEmail, daysInactive });
      
      const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;

      console.log('📤 Calling send-inactivity-warning function...');

      const { data, error } = await supabase.functions.invoke('send-inactivity-warning', {
        body: {
          to: userEmail,
          userName: userName,
          daysInactive: daysInactive,
          dashboardLink: dashboardLink,
          thresholdDays: thresholdDays
        }
      });

      console.log('📬 Inactivity warning response:', { data, error });

      if (error) {
        console.error('❌ Error sending inactivity warning:', error);
        return false;
      }

      // Log the warning
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'inactivity_warning_sent',
          details: {
            days_inactive: daysInactive,
            threshold_days: thresholdDays,
            email_id: data?.id
          }
        });

      console.log('✅ Inactivity warning sent successfully:', { userId, daysInactive, emailId: data?.id });
      return true;
    } catch (error) {
      console.error('💥 Error in sendInactivityWarning:', error);
      return false;
    }
  }

  async sendTrustedContactVerification(
    contactEmail: string, 
    contactName: string, 
    verificationToken: string,
    senderName?: string
  ): Promise<boolean> {
    try {
      console.log('🚀 Starting verification email...', { contactEmail, contactName });
      
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-contact?token=${verificationToken}`;

      console.log('📤 Calling send-verification-email function...');

      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          to: contactEmail,
          contactName: contactName,
          verificationLink: verificationLink,
          verificationToken: verificationToken,
          senderName: senderName
        }
      });

      console.log('📬 Verification email response:', { data, error });

      if (error) {
        console.error('❌ Error sending verification email:', error);
        return false;
      }

      console.log('✅ Verification email sent successfully:', { contactEmail, emailId: data?.id });
      return true;
    } catch (error) {
      console.error('💥 Error in sendTrustedContactVerification:', error);
      return false;
    }
  }

  async sendCustomEmail(emailData: EmailTemplate): Promise<boolean> {
    try {
      console.log('🚀 Starting custom email...', { to: emailData.to, subject: emailData.subject });
      
      console.log('📤 Calling send-email function...');

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      console.log('📬 Custom email response:', { data, error });

      if (error) {
        console.error('❌ Error sending custom email:', error);
        return false;
      }

      console.log('✅ Custom email sent successfully:', { to: emailData.to, emailId: data?.id });
      return true;
    } catch (error) {
      console.error('💥 Error in sendCustomEmail:', error);
      return false;
    }
  }

  async testEmailService(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🧪 Testing email service...');
      
      // Test the generic send-email function
      const testEmail = {
        to: 'test@example.com',
        subject: 'Test Email from If I\'m Gone',
        html: '<h1>Test Email</h1><p>This is a test email to verify the email service is working.</p>',
        text: 'Test Email\n\nThis is a test email to verify the email service is working.'
      };

      console.log('📤 Sending test email...');

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: testEmail
      });

      console.log('📬 Test email response:', { data, error });

      if (error) {
        return {
          success: false,
          message: 'Email service test failed',
          details: error
        };
      }

      return {
        success: true,
        message: 'Email service is working correctly',
        details: data
      };
    } catch (error) {
      console.error('💥 Error testing email service:', error);
      return {
        success: false,
        message: 'Email service test encountered an error',
        details: error
      };
    }
  }

  async sendEmergencyNotification(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    message: string,
    senderName: string
  ): Promise<boolean> {
    try {
      console.log('🚀 Starting emergency notification...', { recipientEmail, subject });
      
      const emailData: EmailTemplate = {
        to: recipientEmail,
        subject: `🚨 Emergency Notification: ${subject}`,
        html: this.generateEmergencyNotificationHTML(recipientName, subject, message, senderName),
        text: this.generateEmergencyNotificationText(recipientName, subject, message, senderName),
        from: 'If I\'m Gone Emergency <emergency@ifimgone.app>'
      };

      return await this.sendCustomEmail(emailData);
    } catch (error) {
      console.error('💥 Error in sendEmergencyNotification:', error);
      return false;
    }
  }

  private generateEmergencyNotificationHTML(recipientName: string, subject: string, message: string, senderName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Emergency Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .emergency { background: #fee2e2; border: 1px solid #dc2626; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Emergency Notification</h1>
              <p>If I'm Gone - Digital Legacy Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${recipientName},</h2>
              
              <div class="emergency">
                <h3>${subject}</h3>
                <p>${message}</p>
              </div>
              
              <p>This emergency notification was sent by the If I'm Gone platform on behalf of <strong>${senderName}</strong>.</p>
              
              <p>If you need immediate assistance or have questions about this notification, please contact our emergency support team.</p>
            </div>
            <div class="footer">
              <p>If I'm Gone - Emergency Notification System</p>
              <p>This is an automated emergency notification</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateEmergencyNotificationText(recipientName: string, subject: string, message: string, senderName: string): string {
    return `
🚨 EMERGENCY NOTIFICATION

Hello ${recipientName},

${subject}

${message}

This emergency notification was sent by the If I'm Gone platform on behalf of ${senderName}.

If you need immediate assistance or have questions about this notification, please contact our emergency support team.

If I'm Gone - Emergency Notification System
This is an automated emergency notification
    `;
  }
}
import { supabase } from './supabase';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendMessage(messageId: string, recipientEmail: string): Promise<boolean> {
    try {
      // Fetch message details
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_user_id_fkey(full_name, email)
        `)
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        console.error('Error fetching message:', messageError);
        return false;
      }

      // Create a secure link for viewing the message
      const messageLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/message/${messageId}`;

      const emailTemplate: EmailTemplate = {
        to: recipientEmail,
        subject: `A message from ${message.profiles?.full_name || 'someone special'}`,
        html: this.generateMessageEmailHTML(message, messageLink),
        text: this.generateMessageEmailText(message, messageLink)
      };

      // Send email using Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailTemplate
      });

      if (error) {
        console.error('Error sending email:', error);
        return false;
      }

      // Update message status to delivered
      await supabase
        .from('messages')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', messageId);

      // Log the delivery
      await supabase
        .from('activity_logs')
        .insert({
          user_id: message.user_id,
          action: 'message_delivered',
          details: {
            message_id: messageId,
            recipient_email: recipientEmail,
            delivery_method: 'email'
          }
        });

      return true;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return false;
    }
  }

  private generateMessageEmailHTML(message: any, messageLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>A Message for You</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .heart { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span class="heart">♥</span> A Special Message for You</h1>
              <p>From: ${message.profiles?.full_name || 'Someone who cares about you'}</p>
            </div>
            <div class="content">
              <h2>${message.title}</h2>
              <p>You have received a heartfelt message that was carefully prepared for you.</p>
              <p>This message was created with love and is now ready for you to read.</p>
              
              <div style="text-align: center;">
                <a href="${messageLink}" class="button">Read Your Message</a>
              </div>
              
              <p><strong>Note:</strong> This message may require a PIN to unlock. If you don't have the PIN, please contact the sender's trusted contacts.</p>
            </div>
            <div class="footer">
              <p>This message was delivered by <strong>If I'm Gone</strong></p>
              <p>A digital legacy platform for preserving important messages</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateMessageEmailText(message: any, messageLink: string): string {
    return `
A Special Message for You

From: ${message.profiles?.full_name || 'Someone who cares about you'}

${message.title}

You have received a heartfelt message that was carefully prepared for you.
This message was created with love and is now ready for you to read.

To read your message, visit: ${messageLink}

Note: This message may require a PIN to unlock. If you don't have the PIN, please contact the sender's trusted contacts.

This message was delivered by If I'm Gone - A digital legacy platform for preserving important messages.
    `;
  }

  async sendInactivityWarning(userId: string, userEmail: string, daysInactive: number): Promise<boolean> {
    try {
      const warningLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;

      const emailTemplate: EmailTemplate = {
        to: userEmail,
        subject: 'Activity Check - If I\'m Gone',
        html: this.generateInactivityWarningHTML(daysInactive, warningLink),
        text: this.generateInactivityWarningText(daysInactive, warningLink)
      };

      const { error } = await supabase.functions.invoke('send-email', {
        body: emailTemplate
      });

      if (error) {
        console.error('Error sending inactivity warning:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in sendInactivityWarning:', error);
      return false;
    }
  }

  private generateInactivityWarningHTML(daysInactive: number, dashboardLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Activity Check - If I'm Gone</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e293b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Activity Check Required</h1>
              <p>If I'm Gone - Digital Legacy Platform</p>
            </div>
            <div class="content">
              <div class="warning">
                <strong>⚠️ Important Notice</strong>
                <p>You have been inactive for ${daysInactive} days.</p>
              </div>
              
              <p>Hello,</p>
              <p>We noticed that you haven't logged into your If I'm Gone account recently. As part of our inactivity monitoring system, we need to verify that you're still active.</p>
              
              <p><strong>What happens if you don't respond?</strong></p>
              <ul>
                <li>If you don't log in within the next 7 days, your scheduled messages may be automatically delivered to their recipients.</li>
                <li>This is part of the digital legacy system you set up to ensure your messages reach your loved ones when needed.</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${dashboardLink}" class="button">Log In to Confirm Activity</a>
              </div>
              
              <p>If you're receiving this email in error or need assistance, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateInactivityWarningText(daysInactive: number, dashboardLink: string): string {
    return `
Activity Check Required - If I'm Gone

⚠️ Important Notice
You have been inactive for ${daysInactive} days.

Hello,

We noticed that you haven't logged into your If I'm Gone account recently. As part of our inactivity monitoring system, we need to verify that you're still active.

What happens if you don't respond?
- If you don't log in within the next 7 days, your scheduled messages may be automatically delivered to their recipients.
- This is part of the digital legacy system you set up to ensure your messages reach your loved ones when needed.

To confirm your activity, please log in to your account: ${dashboardLink}

If you're receiving this email in error or need assistance, please contact our support team.

If I'm Gone - Digital Legacy Platform
    `;
  }
}
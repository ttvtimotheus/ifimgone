import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerificationEmailRequest {
  to: string;
  contactName: string;
  verificationLink: string;
  verificationToken: string;
  senderName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, contactName, verificationLink, verificationToken, senderName }: VerificationEmailRequest = await req.json()

    if (!to || !contactName || !verificationLink) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    const subject = 'Trusted Contact Verification - If I\'m Gone'
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trusted Contact Verification</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #f59e0b, #dc2626); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header p {
              margin: 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content { 
              padding: 40px 30px; 
            }
            .content h2 {
              color: #1f2937;
              margin: 0 0 20px 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content p {
              margin: 0 0 16px 0;
              color: #4b5563;
              line-height: 1.6;
            }
            .content ul {
              margin: 16px 0;
              padding-left: 20px;
              color: #4b5563;
            }
            .content li {
              margin: 8px 0;
            }
            .button { 
              display: inline-block; 
              background: #f59e0b; 
              color: white; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 30px 0;
              font-weight: 600;
              font-size: 16px;
              transition: background-color 0.2s;
            }
            .button:hover {
              background: #d97706;
            }
            .warning { 
              background: #fef3c7; 
              border: 1px solid #f59e0b; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 24px 0;
            }
            .warning strong {
              color: #92400e;
            }
            .warning p {
              margin: 8px 0 0 0;
              color: #92400e;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background-color: #f9fafb;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              margin: 4px 0;
              color: #6b7280;
              font-size: 14px;
            }
            .heart { color: #dc2626; }
            .security-info {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 24px 0;
            }
            .security-info h3 {
              margin: 0 0 12px 0;
              color: #1f2937;
              font-size: 18px;
            }
            .security-info ul {
              margin: 0;
              color: #4b5563;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span class="heart">♥</span> Trusted Contact Verification</h1>
              <p>If I'm Gone - Digital Legacy Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${contactName},</h2>
              
              <p>You have been added as a trusted contact${senderName ? ` by ${senderName}` : ''} on the "If I'm Gone" platform. This means someone trusts you to help manage their digital legacy when they are no longer able to do so themselves.</p>
              
              <p><strong>What does this mean?</strong></p>
              <ul>
                <li>You may be asked to verify if the account owner is inactive or unreachable</li>
                <li>You might help with releasing important messages to loved ones</li>
                <li>You could assist with account management in emergency situations</li>
                <li>You serve as a guardian of their digital memories and final messages</li>
              </ul>
              
              <div class="warning">
                <strong>⚠️ Important Responsibility</strong>
                <p>This is a significant responsibility. Only verify this request if you know the person who added you and are willing to help with their digital legacy. Your role helps ensure their final messages reach their loved ones when needed most.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify as Trusted Contact</a>
              </div>
              
              <div class="security-info">
                <h3>🔒 Security Information</h3>
                <ul>
                  <li>This verification link will expire in 7 days for security</li>
                  <li>Only click the link if you recognize the person who added you</li>
                  <li>You can revoke your trusted contact status at any time</li>
                  <li>All activities are logged for security and transparency</li>
                </ul>
              </div>
              
              <p>If you did not expect this email or don't know who added you, please ignore this message. The verification link will expire automatically and no further action is needed.</p>
              
              <p><strong>Thank you for being willing to help preserve someone's digital legacy.</strong> Your support means the world to them and their loved ones.</p>
            </div>
            <div class="footer">
              <p><strong>If I'm Gone</strong> - Secure Digital Legacy Platform</p>
              <p>This email was sent to verify your role as a trusted contact</p>
              <p style="font-family: monospace; font-size: 12px; color: #9ca3af;">Token: ${verificationToken.substring(0, 8)}...</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Trusted Contact Verification - If I'm Gone

Hello ${contactName},

You have been added as a trusted contact${senderName ? ` by ${senderName}` : ''} on the "If I'm Gone" platform. This means someone trusts you to help manage their digital legacy when they are no longer able to do so themselves.

What does this mean?
- You may be asked to verify if the account owner is inactive or unreachable
- You might help with releasing important messages to loved ones
- You could assist with account management in emergency situations
- You serve as a guardian of their digital memories and final messages

⚠️ Important Responsibility: This is a significant responsibility. Only verify this request if you know the person who added you and are willing to help with their digital legacy.

To verify as a trusted contact, visit: ${verificationLink}

Security Information:
- This verification link will expire in 7 days for security
- Only click the link if you recognize the person who added you
- You can revoke your trusted contact status at any time
- All activities are logged for security and transparency

If you did not expect this email or don't know who added you, please ignore this message. The verification link will expire automatically.

Thank you for being willing to help preserve someone's digital legacy.

If I'm Gone - Secure Digital Legacy Platform
Verification Token: ${verificationToken.substring(0, 8)}...
    `;

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'If I\'m Gone <noreply@ifimgone.app>',
        to: [to],
        subject: subject,
        html: html,
        text: text,
        tags: [
          { name: 'category', value: 'verification' },
          { name: 'type', value: 'trusted-contact' }
        ]
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Resend API error:', errorText)
      throw new Error(`Failed to send verification email: ${errorText}`)
    }

    const data = await res.json()
    console.log('✅ Verification email sent:', { id: data.id, to, contactName })

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
        to,
        subject,
        status: 'sent'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error sending verification email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
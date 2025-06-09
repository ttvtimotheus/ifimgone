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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, contactName, verificationLink, verificationToken }: VerificationEmailRequest = await req.json()

    if (!to || !contactName || !verificationLink) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
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
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .heart { color: #dc2626; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
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
              
              <p>You have been added as a trusted contact on the "If I'm Gone" platform. This means someone trusts you to help manage their digital legacy when they are no longer able to do so themselves.</p>
              
              <p><strong>What does this mean?</strong></p>
              <ul>
                <li>You may be asked to verify if the account owner is inactive or unreachable</li>
                <li>You might help with releasing important messages to loved ones</li>
                <li>You could assist with account management in emergency situations</li>
              </ul>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This is a significant responsibility. Only verify this request if you know the person who added you and are willing to help with their digital legacy.
              </div>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify as Trusted Contact</a>
              </div>
              
              <p><strong>Security Information:</strong></p>
              <ul>
                <li>This verification link will expire in 7 days</li>
                <li>Only click the link if you recognize the person who added you</li>
                <li>You can revoke your trusted contact status at any time</li>
              </ul>
              
              <p>If you did not expect this email or don't know who added you, please ignore this message. The verification link will expire automatically.</p>
              
              <p>Thank you for being willing to help preserve someone's digital legacy.</p>
            </div>
            <div class="footer">
              <p>This email was sent by <strong>If I'm Gone</strong></p>
              <p>A secure platform for digital legacy management</p>
              <p>Verification Token: ${verificationToken.substring(0, 8)}...</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Trusted Contact Verification - If I'm Gone

Hello ${contactName},

You have been added as a trusted contact on the "If I'm Gone" platform. This means someone trusts you to help manage their digital legacy when they are no longer able to do so themselves.

What does this mean?
- You may be asked to verify if the account owner is inactive or unreachable
- You might help with releasing important messages to loved ones
- You could assist with account management in emergency situations

⚠️ Important: This is a significant responsibility. Only verify this request if you know the person who added you and are willing to help with their digital legacy.

To verify as a trusted contact, visit: ${verificationLink}

Security Information:
- This verification link will expire in 7 days
- Only click the link if you recognize the person who added you
- You can revoke your trusted contact status at any time

If you did not expect this email or don't know who added you, please ignore this message. The verification link will expire automatically.

Thank you for being willing to help preserve someone's digital legacy.

This email was sent by If I'm Gone - A secure platform for digital legacy management
Verification Token: ${verificationToken.substring(0, 8)}...
    `;

    // In production, replace this with actual email service integration
    console.log('Sending trusted contact verification email:', { to, contactName })
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockResponse = {
      id: `verification_${Date.now()}`,
      to,
      subject,
      status: 'sent'
    }

    return new Response(
      JSON.stringify(mockResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending verification email:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
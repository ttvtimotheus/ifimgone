import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MessageDeliveryRequest {
  to: string;
  recipientName: string;
  senderName: string;
  messageTitle: string;
  messageLink: string;
  messageId: string;
  hasPin?: boolean;
  deliveryReason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      to, 
      recipientName, 
      senderName, 
      messageTitle, 
      messageLink, 
      messageId,
      hasPin = false,
      deliveryReason = 'scheduled delivery'
    }: MessageDeliveryRequest = await req.json()

    if (!to || !recipientName || !senderName || !messageTitle || !messageLink) {
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

    const subject = `💌 A Special Message from ${senderName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>A Special Message for You</title>
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
              font-size: 32px;
              font-weight: 600;
            }
            .header p {
              margin: 0;
              opacity: 0.9;
              font-size: 18px;
            }
            .content { 
              padding: 40px 30px; 
            }
            .content h2 {
              color: #1f2937;
              margin: 0 0 20px 0;
              font-size: 28px;
              font-weight: 600;
              text-align: center;
            }
            .content p {
              margin: 0 0 16px 0;
              color: #4b5563;
              line-height: 1.6;
              font-size: 16px;
            }
            .message-preview {
              background: linear-gradient(135deg, #fef3c7, #fed7aa);
              border: 1px solid #f59e0b;
              padding: 30px;
              border-radius: 12px;
              margin: 30px 0;
              text-align: center;
            }
            .message-preview h3 {
              margin: 0 0 16px 0;
              color: #92400e;
              font-size: 24px;
              font-weight: 600;
            }
            .message-preview p {
              margin: 0;
              color: #92400e;
              font-size: 16px;
              font-style: italic;
            }
            .button { 
              display: inline-block; 
              background: #f59e0b; 
              color: white; 
              padding: 18px 36px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 30px 0;
              font-weight: 600;
              font-size: 18px;
              transition: all 0.2s;
              box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);
            }
            .button:hover {
              background: #d97706;
              transform: translateY(-1px);
              box-shadow: 0 6px 8px rgba(245, 158, 11, 0.4);
            }
            .security-note {
              background: #f3f4f6;
              border-left: 4px solid #6b7280;
              padding: 20px;
              margin: 24px 0;
              border-radius: 0 8px 8px 0;
            }
            .security-note h4 {
              margin: 0 0 8px 0;
              color: #374151;
              font-size: 16px;
            }
            .security-note p {
              margin: 0;
              color: #4b5563;
              font-size: 14px;
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
            .legacy-note {
              background: linear-gradient(135deg, #ede9fe, #ddd6fe);
              border: 1px solid #8b5cf6;
              padding: 24px;
              border-radius: 12px;
              margin: 30px 0;
              text-align: center;
            }
            .legacy-note p {
              margin: 0;
              color: #5b21b6;
              font-size: 15px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span class="heart">♥</span> A Special Message for You</h1>
              <p>From someone who cares about you deeply</p>
            </div>
            <div class="content">
              <h2>Dear ${recipientName},</h2>
              
              <p>You have received a heartfelt message from <strong>${senderName}</strong> that was carefully prepared for you with love and thoughtfulness.</p>
              
              <div class="message-preview">
                <h3>"${messageTitle}"</h3>
                <p>This message was created with care and is now ready for you to read.</p>
              </div>
              
              <p>This message represents a piece of ${senderName}'s heart and thoughts, preserved to reach you at this moment. It may contain words of love, wisdom, memories, or guidance that they wanted to share with you.</p>
              
              <div style="text-align: center;">
                <a href="${messageLink}" class="button">Read Your Message</a>
              </div>
              
              ${hasPin ? `
                <div class="security-note">
                  <h4>🔒 Security Notice</h4>
                  <p>This message is protected with a PIN for privacy. If you don't have the PIN, please contact ${senderName}'s trusted contacts or family members who may have this information.</p>
                </div>
              ` : ''}
              
              <div class="legacy-note">
                <p>This message was delivered as part of ${senderName}'s digital legacy - a way to ensure important words reach the people who matter most, when they matter most.</p>
              </div>
              
              <p>Take your time reading this message. It was created with love and delivered with the hope that it brings you comfort, joy, or whatever emotion ${senderName} intended to share with you.</p>
              
              <p><strong>With love and remembrance,</strong><br>The If I'm Gone Team</p>
            </div>
            <div class="footer">
              <p><strong>If I'm Gone</strong> - Digital Legacy Platform</p>
              <p>Preserving love, memories, and important messages</p>
              <p style="font-family: monospace; font-size: 12px; color: #9ca3af;">Message ID: ${messageId.substring(0, 8)}...</p>
              <div style="margin-top: 16px;">
                <span class="heart">♥</span> <span style="color: #6b7280;">Created with love</span> <span class="heart">♥</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
A Special Message for You

Dear ${recipientName},

You have received a heartfelt message from ${senderName} that was carefully prepared for you with love and thoughtfulness.

Message Title: "${messageTitle}"

This message represents a piece of ${senderName}'s heart and thoughts, preserved to reach you at this moment. It may contain words of love, wisdom, memories, or guidance that they wanted to share with you.

To read your message, visit: ${messageLink}

${hasPin ? 
  '🔒 Security Notice: This message is protected with a PIN for privacy. If you don\'t have the PIN, please contact ' + senderName + '\'s trusted contacts or family members who may have this information.' : 
  ''
}

This message was delivered as part of ${senderName}'s digital legacy - a way to ensure important words reach the people who matter most, when they matter most.

Take your time reading this message. It was created with love and delivered with the hope that it brings you comfort, joy, or whatever emotion ${senderName} intended to share with you.

With love and remembrance,
The If I'm Gone Team

If I'm Gone - Digital Legacy Platform
Preserving love, memories, and important messages
Message ID: ${messageId.substring(0, 8)}...
    `;

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderName} via If I'm Gone <messages@ifimgone.app>`,
        to: [to],
        subject: subject,
        html: html,
        text: text,
        reply_to: 'support@ifimgone.app',
        tags: [
          { name: 'category', value: 'message-delivery' },
          { name: 'sender', value: senderName },
          { name: 'reason', value: deliveryReason }
        ]
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Resend API error:', errorText)
      throw new Error(`Failed to send message delivery email: ${errorText}`)
    }

    const data = await res.json()
    console.log('✅ Message delivery email sent:', { id: data.id, to, messageTitle })

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
    console.error('❌ Error sending message delivery email:', error)
    
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
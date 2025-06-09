import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InactivityWarningRequest {
  to: string;
  userName: string;
  daysInactive: number;
  dashboardLink: string;
  thresholdDays: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, userName, daysInactive, dashboardLink, thresholdDays }: InactivityWarningRequest = await req.json()

    if (!to || !userName || !daysInactive || !dashboardLink) {
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

    const subject = '⚠️ Activity Check Required - If I\'m Gone'
    const daysRemaining = Math.max(0, (thresholdDays || 30) - daysInactive)
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Activity Check Required</title>
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
              background: linear-gradient(135deg, #1e293b, #334155); 
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
              border-left: 4px solid #f59e0b; 
              padding: 20px; 
              margin: 24px 0;
              border-radius: 0 8px 8px 0;
            }
            .warning strong {
              color: #92400e;
              font-size: 18px;
            }
            .warning p {
              margin: 8px 0 0 0;
              color: #92400e;
            }
            .critical-warning {
              background: #fee2e2;
              border-left: 4px solid #dc2626;
              padding: 20px;
              margin: 24px 0;
              border-radius: 0 8px 8px 0;
            }
            .critical-warning strong {
              color: #991b1b;
              font-size: 18px;
            }
            .critical-warning p {
              margin: 8px 0 0 0;
              color: #991b1b;
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
            .stats {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 24px 0;
              text-align: center;
            }
            .stats h3 {
              margin: 0 0 16px 0;
              color: #1f2937;
            }
            .stat-item {
              display: inline-block;
              margin: 0 20px;
              text-align: center;
            }
            .stat-number {
              font-size: 32px;
              font-weight: bold;
              color: #f59e0b;
              display: block;
            }
            .stat-label {
              font-size: 14px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Activity Check Required</h1>
              <p>If I'm Gone - Digital Legacy Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              
              <div class="stats">
                <h3>Account Activity Status</h3>
                <div class="stat-item">
                  <span class="stat-number">${daysInactive}</span>
                  <span class="stat-label">Days Inactive</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">${daysRemaining}</span>
                  <span class="stat-label">Days Remaining</span>
                </div>
              </div>

              ${daysRemaining <= 3 ? `
                <div class="critical-warning">
                  <strong>🚨 Urgent Action Required</strong>
                  <p>You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining to confirm your activity before your scheduled messages may be automatically delivered to their recipients.</p>
                </div>
              ` : `
                <div class="warning">
                  <strong>⚠️ Important Notice</strong>
                  <p>You have been inactive for ${daysInactive} days. Please log in to confirm you're still active.</p>
                </div>
              `}
              
              <p>We noticed that you haven't logged into your If I'm Gone account recently. As part of our inactivity monitoring system, we need to verify that you're still active and able to manage your digital legacy.</p>
              
              <p><strong>What happens if you don't respond?</strong></p>
              <ul>
                <li>If you don't log in within the next ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}, your scheduled messages may be automatically delivered to their recipients</li>
                <li>This is part of the digital legacy system you set up to ensure your messages reach your loved ones when needed</li>
                <li>Your trusted contacts may be notified to verify your status</li>
                <li>All message deliveries are logged and can be reviewed</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${dashboardLink}" class="button">Log In to Confirm Activity</a>
              </div>
              
              <p><strong>Need help?</strong> If you're receiving this email in error, having trouble accessing your account, or need assistance, please contact our support team immediately.</p>
              
              <p>Your digital legacy is important, and we're here to ensure it's preserved and delivered according to your wishes.</p>
            </div>
            <div class="footer">
              <p><strong>If I'm Gone</strong> - Digital Legacy Platform</p>
              <p>This is an automated security notification</p>
              <p>Last activity: ${daysInactive} days ago</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Activity Check Required - If I'm Gone

Hello ${userName},

⚠️ IMPORTANT NOTICE
You have been inactive for ${daysInactive} days.

Account Activity Status:
- Days Inactive: ${daysInactive}
- Days Remaining: ${daysRemaining}

${daysRemaining <= 3 ? 
  `🚨 URGENT ACTION REQUIRED: You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining to confirm your activity before your scheduled messages may be automatically delivered.` :
  'Please log in to confirm you\'re still active.'
}

We noticed that you haven't logged into your If I'm Gone account recently. As part of our inactivity monitoring system, we need to verify that you're still active and able to manage your digital legacy.

What happens if you don't respond?
- If you don't log in within the next ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}, your scheduled messages may be automatically delivered to their recipients
- This is part of the digital legacy system you set up to ensure your messages reach your loved ones when needed
- Your trusted contacts may be notified to verify your status
- All message deliveries are logged and can be reviewed

To confirm your activity, please log in to your account: ${dashboardLink}

Need help? If you're receiving this email in error, having trouble accessing your account, or need assistance, please contact our support team immediately.

Your digital legacy is important, and we're here to ensure it's preserved and delivered according to your wishes.

If I'm Gone - Digital Legacy Platform
Last activity: ${daysInactive} days ago
    `;

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'If I\'m Gone Security <security@ifimgone.app>',
        to: [to],
        subject: subject,
        html: html,
        text: text,
        tags: [
          { name: 'category', value: 'security' },
          { name: 'type', value: 'inactivity-warning' },
          { name: 'urgency', value: daysRemaining <= 3 ? 'high' : 'medium' }
        ]
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Resend API error:', errorText)
      throw new Error(`Failed to send inactivity warning: ${errorText}`)
    }

    const data = await res.json()
    console.log('✅ Inactivity warning sent:', { id: data.id, to, daysInactive })

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
    console.error('❌ Error sending inactivity warning:', error)
    
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
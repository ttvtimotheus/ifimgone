import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // In a real implementation, you would use a service like:
    // - Resend
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // etc.

    // For now, we'll simulate sending an email
    console.log('Sending email:', { to, subject })
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In production, replace this with actual email service integration
    // Example with Resend:
    /*
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'If I\'m Gone <noreply@ifimgone.com>',
        to: [to],
        subject: subject,
        html: html,
        text: text,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const data = await res.json()
    */

    // For development, we'll just log and return success
    const mockResponse = {
      id: `mock_${Date.now()}`,
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
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
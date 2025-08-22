import { corsHeaders } from '../_shared/cors.ts'

interface EmailRequest {
  to: string
  subject: string
  html: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const emailData: EmailRequest = await req.json()

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // In a real implementation, you would integrate with an email service
    // For example, using SendGrid, Mailgun, or AWS SES
    
    // Example with SendGrid (you would need to add the API key as an environment variable):
    /*
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sendGridApiKey) {
      throw new Error('SendGrid API key not configured')
    }

    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailData.to }],
          subject: emailData.subject,
        }],
        from: { email: 'noreply@kitchenpos.com', name: 'Kitchen POS' },
        content: [{
          type: 'text/html',
          value: emailData.html,
        }],
      }),
    })

    if (!sendGridResponse.ok) {
      const error = await sendGridResponse.text()
      throw new Error(`SendGrid error: ${error}`)
    }
    */

    // For now, we'll just log the email and return success
    console.log('Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      htmlLength: emailData.html.length
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        recipient: emailData.to
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
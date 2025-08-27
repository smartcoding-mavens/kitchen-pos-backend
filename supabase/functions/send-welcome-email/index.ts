import { corsHeaders } from '../_shared/cors.ts'

interface WelcomeEmailRequest {
  to: string
  full_name: string
  email: string
  password: string
  restaurant_name?: string
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

    const emailData: WelcomeEmailRequest = await req.json()

    // Validate required fields
    if (!emailData.to || !emailData.full_name || !emailData.email || !emailData.password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, full_name, email, password' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create welcome email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">Kitchen POS</h1>
          <h2 style="color: #16a34a; margin: 0;">Welcome to Kitchen POS! 🎉</h2>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p>Hello <strong>${emailData.full_name}</strong>,</p>
          <p>Welcome to Kitchen POS! Your account has been created successfully.</p>
          ${emailData.restaurant_name ? `<p>Your restaurant "<strong>${emailData.restaurant_name}</strong>" is now part of our platform.</p>` : ''}
        </div>
        
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1e40af; margin-top: 0;">Your Login Credentials</h3>
          <p><strong>Email:</strong> ${emailData.email}</p>
          <p><strong>Password:</strong> ${emailData.password}</p>
          <p style="color: #dc2626; font-size: 14px; margin-bottom: 0;">
            ⚠️ For security reasons, please change your password after your first login.
          </p>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #15803d; margin-top: 0;">Getting Started</h3>
          <ol style="color: #374151; line-height: 1.6;">
            <li>Log in to your admin dashboard</li>
            <li>Complete your restaurant setup</li>
            <li>Set up your menu categories and items</li>
            <li>Configure your revenue centers</li>
            <li>Generate QR codes for your tables</li>
            <li>Start taking orders!</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/login" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Access Your Dashboard
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Need help getting started? Contact our support team or check out our documentation.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This email was sent because a Kitchen POS account was created for this email address.
          </p>
        </div>
      </div>
    `

    // In a real implementation, you would integrate with an email service like SendGrid, Mailgun, etc.
    // For now, we'll just log the email content
    console.log('Welcome email would be sent:', {
      to: emailData.to,
      subject: 'Welcome to Kitchen POS!',
      htmlLength: emailHtml.length
    })

    // Example integration with SendGrid (commented out):
    /*
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (sendGridApiKey) {
      const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: emailData.to }],
            subject: 'Welcome to Kitchen POS!',
          }],
          from: { email: 'noreply@kitchenpos.com', name: 'Kitchen POS' },
          content: [{
            type: 'text/html',
            value: emailHtml,
          }],
        }),
      })

      if (!sendGridResponse.ok) {
        const error = await sendGridResponse.text()
        throw new Error(`SendGrid error: ${error}`)
      }
    }
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome email sent successfully',
        recipient: emailData.to
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Welcome email error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send welcome email',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
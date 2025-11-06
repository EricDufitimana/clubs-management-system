// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Declare Deno for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface Email {
  recipient_emails: string[];
  subject: string;
  content: string;
}

// @ts-ignore
serve(async (req) => {
  console.log(`[DEBUG] Edge function started - Method: ${req.method}, URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[DEBUG] Handling CORS preflight request');
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    console.log('[DEBUG] Parsing request body...');
    const email: Email = await req.json();
    console.log(`[DEBUG] Parsed email data:`, {
      recipientCount: email.recipient_emails?.length || 0,
      subject: email.subject ? `${email.subject.substring(0, 50)}...` : 'undefined',
      contentLength: email.content?.length || 0,
      hasRecipients: !!email.recipient_emails,
      hasSubject: !!email.subject,
      hasContent: !!email.content
    });

    // Validate recipient emails
    if(!email.recipient_emails || email.recipient_emails.length === 0) {
      console.log('[ERROR] No recipient emails provided');
      return new Response(JSON.stringify({ error: "Recipient emails are required" }), { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }

    // Validate subject and content
    if(!email.subject || !email.content) {
      console.log('[ERROR] Missing required fields:', {
        hasSubject: !!email.subject,
        hasContent: !!email.content
      });
      return new Response(JSON.stringify({ error: "Subject and content are required" }), { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }

    // Check for API key
    console.log('[DEBUG] Checking for BREVO_API_KEY...');
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if(!brevoApiKey) {
      console.log('[ERROR] BREVO_API_KEY is not set');
      return new Response(JSON.stringify({ error: "BREVO_API_KEY is not set" }), { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }
    console.log('[DEBUG] BREVO_API_KEY found (length:', brevoApiKey.length, ')');

    // Prepare email payload
    const emailPayload = {
      sender: {
        name: "CMS Admin",
        email: "streamoviesnetflix@gmail.com",
      },
      to: email.recipient_emails.map(email => ({email})),
      subject: email.subject,
      htmlContent: email.content,
    };

    console.log('[DEBUG] Prepared email payload:', {
      sender: emailPayload.sender,
      recipientCount: emailPayload.to.length,
      subject: emailPayload.subject,
      contentLength: emailPayload.htmlContent.length,
      firstRecipient: emailPayload.to[0]?.email || 'none'
    });

    // Make API call to Brevo
    // Note: Supabase Edge Functions have dynamic IPs. If you encounter IP authorization errors,
    // you need to disable IP restrictions in Brevo settings: https://app.brevo.com/security/authorised_ips
    console.log('[DEBUG] Making API call to Brevo...');
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(emailPayload)
    });

    console.log(`[DEBUG] Brevo API response status: ${brevoResponse.status}`);
    console.log(`[DEBUG] Brevo API response headers:`, Object.fromEntries(brevoResponse.headers.entries()));

    const data = await brevoResponse.json();
    console.log('[DEBUG] Brevo API response data:', data);

    if(!brevoResponse.ok) {
      console.log('[ERROR] Brevo API call failed:', {
        status: brevoResponse.status,
        statusText: brevoResponse.statusText,
        data: data
      });
      return new Response(JSON.stringify({ 
        error: "Failed to send email", 
        details: data,
        status: brevoResponse.status,
        statusText: brevoResponse.statusText
      }), { 
        status: brevoResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }

    console.log('[SUCCESS] Email sent successfully to', email.recipient_emails.length, 'recipients');
    return new Response(JSON.stringify({ 
      message: "Email sent successfully",
      recipientCount: email.recipient_emails.length,
      messageId: data.messageId || 'unknown'
    }), { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });
 } catch (error) {
  const err = error as Error;
  console.log('[ERROR] Unexpected error occurred:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  return new Response(JSON.stringify({ 
    error: "Internal server error",
    details: err.message,
    timestamp: new Date().toISOString()
  }), { 
    status: 500,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    }
  });
 }
 
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send_invite_emails' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"recipient_emails":["test@example.com"],"subject":"Test","content":"<h1>Test</h1>"}'

*/

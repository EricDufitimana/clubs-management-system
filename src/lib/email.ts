
export async function sendClubInvite({
  to,
  clubName,
  role,
  inviteLink,
  expiresAt
}: {
  to: string;
  clubName: string;
  role: string;
  inviteLink: string;
  expiresAt: Date;
}) {
  try {
    const expiresAtFormatted = expiresAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">You're Invited! 🎉</h1>
          
          <p>You've been invited to join <strong>${clubName}</strong> as the <strong>${role}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0;">Click the button below to accept your invitation:</p>
            
            <a 
              href="${inviteLink}"
              style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;"
            >
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This invitation expires on ${expiresAtFormatted}
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          
          <p style="color: #9ca3af; font-size: 12px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </body>
      </html>
    `;

    // Get Supabase URL and anon key for edge function call
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[SEND_EMAIL] Supabase configuration missing');
      return { error: 'Email service configuration error' };
    }

    // Call the edge function
    const functionUrl = `${supabaseUrl}/functions/v1/send_invite_emails`;
    
    console.log('[SEND_EMAIL] Calling edge function:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        recipient_emails: [to],
        subject: `You're invited to join ${clubName}!`,
        content: htmlContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[SEND_EMAIL] Edge function error:', data);
      return { error: data.error || 'Failed to send email', details: data.details };
    }

    console.log('[SEND_EMAIL] Email sent successfully:', data.messageId);
    return { success: true, emailId: data.messageId };
  } catch (error) {
    console.error('[SEND_EMAIL] Exception:', error);
    return { error: 'Failed to send email' };
  }
}


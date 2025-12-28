
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

    const currentYear = new Date().getFullYear();

    // Create HTML email content (minimal, professional, text-forward)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#ffffff;">
          <div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px 20px; color:#111827; background:#ffffff;">
            <h1 style="font-size:20px; margin:0 0 16px 0; font-weight:700;">
              Invitation to manage ${clubName}
            </h1>

            <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6;">
              Hello,
            </p>

            <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6;">
              You've been invited to access the Clubs Management System for <strong>${clubName}</strong> as <strong>${role}</strong>.
              This access is intended for club administration (managing club information and activity), not an appointment to an official title.
            </p>

            <p style="margin:0 0 10px 0; font-size:14px; line-height:1.6;">
              With this access, you can:
            </p>
            <ul style="margin:0 0 16px 20px; padding:0; font-size:14px; line-height:1.8;">
              <li>Manage members (add/remove and view member lists)</li>
              <li>Create and manage sessions and events</li>
              <li>Record and review attendance</li>
              <li>Update club details and settings</li>
              <li>View reports and analytics (where available)</li>
            </ul>

            <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6;">
              To accept this invitation and set up your account, use the link below:
            </p>

            <p style="margin:0 0 18px 0; font-size:14px; line-height:1.6;">
              <a href="${inviteLink}" style="color:#111827; text-decoration:underline;">${inviteLink}</a>
            </p>

            <p style="margin:0 0 18px 0; font-size:14px; line-height:1.6;">
              This invitation expires on <strong>${expiresAtFormatted}</strong>.
            </p>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

            <p style="margin:0 0 8px 0; font-size:12px; line-height:1.6; color:#6b7280;">
              If you weren't expecting this email, you can ignore it. No account will be created unless you accept the invitation.
            </p>
            <p style="margin:0; font-size:12px; line-height:1.6; color:#9ca3af;">
              © ${currentYear} Clubs Management System
            </p>
          </div>
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


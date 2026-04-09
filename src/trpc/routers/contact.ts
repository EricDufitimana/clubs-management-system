import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { baseProcedure, createTRPCRouter } from '../init';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  interest: z.string(),
  budget: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});

export const contactRouter = createTRPCRouter({
  sendEmail: baseProcedure
    .input(contactSchema)
    .mutation(async ({ input }) => {
      const { name, email, interest, budget, message } = input;
      console.log('Contact form submission:', { name, email });

      // Brevo API configuration
      const BREVO_API_KEY = process.env.BREVO_API_KEY;
      const RECIPIENT_EMAIL = 'ericdufitimanaasyv@gmail.com';

      if (!BREVO_API_KEY) {
        console.error('BREVO_API_KEY not configured');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Email service not configured',
        });
      }

      try {
        // Prepare email data for Brevo
        const emailData = {
          sender: {
            name: name,
            email: email
          },
          to: [{
            email: RECIPIENT_EMAIL,
            name: 'CMS Admin'
          }],
          subject: `New Contact Form Submission from ${name}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="margin-bottom: 20px; color: #000;">New Contact Form Submission</h2>
              
              <div style="margin-bottom: 20px;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Interest:</strong> ${interest}</p>
                <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 10px;">Message:</h3>
                <p style="white-space: pre-wrap; line-height: 1.5; background: #f9f9f9; padding: 15px; border-left: 3px solid #ccc;">${message}</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                This email was sent from the CMS contact form.<br>
                Sent on: ${new Date().toLocaleString()}
              </p>
            </div>
          `
        };

        console.log('Sending email via Brevo...');
        // Send email via Brevo API
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY
          },
          body: JSON.stringify(emailData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Brevo API error:', response.status);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send email via Brevo',
          });
        }

        const result = await response.json();
        console.log('Email sent successfully');

        return {
          success: true,
          message: 'Email sent successfully',
          messageId: result.messageId
        };

      } catch (error) {
        console.error('Contact form error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send email. Please try again later.',
        });
      }
    }),
});

'use server';
import { prisma } from '../lib/prisma';
import { createClient } from '../utils/supabase/server';
import { randomBytes } from 'crypto';
import { sendClubInvite } from '../lib/email';

interface InviteInput {
  role: 'president' | 'vice_president' | 'secretary';
  email: string;
  name?: string;
}

export async function generateAndSendInvites(
  clubId: string, 
  invites: InviteInput[]
) {
  const supabase = await createClient();
  
  // Verify user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: 'Unauthorized' };
  }

  try {
    // Get club info
    const club = await prisma.club.findUnique({
      where: { id: BigInt(clubId) }
    });
    
    if (!club) {
      return { error: 'Club not found' };
    }

    const results = [];
    
    for (const invite of invites) {
      // Generate secure random token
      const token = randomBytes(32).toString('hex');
      
      // Create invite that expires in 7 days
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const dbInvite = await prisma.clubInvite.create({
        data: {
          club_id: BigInt(clubId),
          role: invite.role,
          token,
          email: invite.email,
          expires_at: expiresAt
        }
      });
      
      const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/join-club/${token}`;
      
      // Format role name for display
      const roleDisplayName = invite.role === 'vice_president' 
        ? 'Vice President' 
        : invite.role.charAt(0).toUpperCase() + invite.role.slice(1);
      
      // Send email
      const emailResult = await sendClubInvite({
        to: invite.email,
        clubName: club.club_name,
        role: roleDisplayName,
        inviteLink,
        expiresAt
      });
      
      results.push({
        role: invite.role,
        email: invite.email,
        link: inviteLink,
        emailSent: !emailResult.error,
        emailError: emailResult.error
      });
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('[GENERATE_INVITES] Error:', error);
    return { error: 'Failed to generate invites' };
  }
}


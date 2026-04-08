'use server';

import { prisma } from '../lib/prisma';

export async function validateInvite(token: string) {
  try {
    // Find the invite by token
    const invite = await prisma.clubInvite.findUnique({
      where: { token }
    });

    if (!invite) {
      return { error: 'Invalid invitation token' };
    }

    // Get club info
    const club = await prisma.club.findUnique({
      where: { id: invite.club_id }
    });

    if (!club) {
      return { error: 'Club not found' };
    }

    // Check if invite has expired
    if (new Date() > invite.expires_at) {
      return { error: 'This invitation has expired' };
    }

    // Check if invite has already been used
    if (invite.used_at) {
      return { error: 'This invitation has already been used' };
    }

    // Format role name for display
    const roleDisplayName = invite.role || '';

    return { 
      success: true,
      invite: {
        token: invite.token,
        email: invite.email,
        role: invite.role,
        roleDisplayName,
        clubId: invite.club_id.toString(),
        clubName: club.club_name,
        expiresAt: invite.expires_at
      }
    };
  } catch (error) {
    console.error('[VALIDATE_INVITE] Error:', error);
    return { error: 'Failed to validate invitation' };
  }
}


'use server';
import { prisma } from '../lib/prisma';
import { createClient } from '../utils/supabase/server';

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  
  try {
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'You must be logged in to accept an invitation' };
    }

    // Find the invite by token
    const invite = await prisma.clubInvite.findUnique({
      where: { token }
    });

    if (!invite) {
      return { error: 'Invalid invitation token' };
    }

    // Get club info separately
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

    // Find or create user in users table
    let dbUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id }
    });

    if (!dbUser) {
      // Create user if they don't exist
      dbUser = await prisma.user.create({
        data: {
          auth_user_id: user.id,
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || '',
          role: 'admin' // Default role
        }
      });
    }

    // Check if user is already a leader for this club using raw query
    const existingLeader = await prisma.$queryRaw<Array<{id: bigint}>>`
      SELECT id FROM club_leaders 
      WHERE club_id = ${invite.club_id}::bigint 
      AND user_id = ${dbUser.id}::bigint
    `;

    if (existingLeader && existingLeader.length > 0) {
      // Mark invite as used
      await prisma.clubInvite.update({
        where: { id: invite.id },
        data: { used_at: new Date() }
      });
      return { error: 'You are already a leader of this club' };
    }

    // Create club leader record using raw query
    await prisma.$executeRaw`
      INSERT INTO club_leaders (club_id, user_id, role, created_at)
      VALUES (${invite.club_id}::bigint, ${dbUser.id}::bigint, ${invite.role}::role, NOW())
    `;

    // Mark invite as used
    await prisma.clubInvite.update({
      where: { id: invite.id },
      data: { used_at: new Date() }
    });

    return { 
      success: true, 
      message: `Successfully joined ${club.club_name} as ${invite.role}`,
      clubId: invite.club_id.toString()
    };
  } catch (error) {
    console.error('[ACCEPT_INVITE] Error:', error);
    return { error: 'Failed to accept invitation' };
  }
}


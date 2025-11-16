'use server';

import { requireRole } from 'src/utils/get-user-role';
import { createClient } from 'src/utils/supabase/server';

import { prisma } from 'src/lib/prisma';

export async function updateSession(
  sessionId: string,
  clubId: string,
  notes: string,
  date: string
) {
  try {
    // Check if user has permission (admin or super_admin)
    const authResult = await requireRole(['admin', 'super_admin']);
    if ('error' in authResult) {
      return { error: authResult.error };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    if (!sessionId || !clubId || !notes || !date) {
      return { error: 'Missing required fields' };
    }

    // Verify admin has access to this club
    if (authResult.role === 'admin') {
      const dbUser = await prisma.user.findUnique({
        where: { auth_user_id: user.id },
      });

      if (!dbUser) {
        return { error: 'User not found' };
      }

      const clubLeader = await prisma.$queryRaw<Array<{ club_id: bigint }>>`
        SELECT club_id FROM club_leaders WHERE user_id = ${dbUser.id}::bigint AND club_id = ${BigInt(clubId)}::bigint LIMIT 1
      `;

      if (!clubLeader || clubLeader.length === 0) {
        return { error: 'Unauthorized to update session for this club' };
      }
    }

    // Verify the session exists and belongs to the club
    const existingSession = await prisma.session.findUnique({
      where: { id: BigInt(sessionId) },
    });

    if (!existingSession) {
      return { error: 'Session not found' };
    }

    if (existingSession.club_id.toString() !== clubId) {
      return { error: 'Session does not belong to this club' };
    }

    // Update the session
    const updatedSession = await prisma.session.update({
      where: { id: BigInt(sessionId) },
      data: {
        notes,
        date: new Date(date),
      },
    });

    return {
      success: true,
      message: 'Session updated successfully',
      session: {
        id: updatedSession.id.toString(),
        club_id: updatedSession.club_id.toString(),
        notes: updatedSession.notes,
        date: updatedSession.date.toISOString(),
      },
    };
  } catch (error: any) {
    console.error('[UPDATE_SESSION] Error:', error);
    return { error: error?.message || 'Failed to update session' };
  }
}


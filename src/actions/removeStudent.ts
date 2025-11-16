'use server';

import { requireRole } from 'src/utils/get-user-role';
import { createClient } from 'src/utils/supabase/server';

import { prisma } from 'src/lib/prisma';

export async function removeStudent(studentId: string, clubId?: string) {
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

    if (!studentId) {
      return { error: 'Student ID is required' };
    }

    // If clubId not provided, get from current user
    let targetClubId: bigint;
    
    if (!clubId) {
      const dbUser = await prisma.user.findUnique({
        where: { auth_user_id: user.id }
      });

      if (!dbUser) {
        return { error: 'User not found' };
      }

      // Get the club this user is a leader of
      const clubLeader = await prisma.$queryRaw<Array<{
        club_id: bigint;
      }>>`
        SELECT cl.club_id
        FROM club_leaders cl
        WHERE cl.user_id = ${dbUser.id}::bigint
        LIMIT 1
      `;

      if (clubLeader.length === 0) {
        return { error: 'You are not a leader of any club' };
      }

      targetClubId = clubLeader[0].club_id;
    } else {
      targetClubId = BigInt(clubId);
    }

    // Update membership status to 'left'
    await prisma.$executeRaw`
      UPDATE "club-members"
      SET membership_status = 'left',
          left_at = NOW()
      WHERE student_id = ${BigInt(studentId)}::bigint
        AND club_id = ${targetClubId}::bigint
    `;

    return { success: true, message: 'Member removed successfully' };
  } catch (error: any) {
    console.error('[REMOVE_STUDENT] Error:', error);
    return { error: error?.message || 'Failed to remove member' };
  }
}


'use server';
import { NextResponse } from 'next/server';
import { prisma } from 'src/lib/prisma';
import { createClient } from 'src/utils/supabase/server';
import { getAvatarUrl } from 'src/utils/get-avatar';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');
    
    let clubIds: bigint[] = [];
    
    // If user_id is provided, filter by clubs where that user is a leader
    if (userIdParam) {
      const dbUser = await prisma.user.findUnique({
        where: { auth_user_id: userIdParam }
      });
      
      if (dbUser) {
        const userClubs = await prisma.$queryRaw<Array<{club_id: bigint}>>`
          SELECT club_id 
          FROM club_leaders 
          WHERE user_id = ${dbUser.id}::bigint
        `;
        clubIds = userClubs.map(c => c.club_id);
      }
    }

    if (clubIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get left members with their join and leave dates
    const leftMembers = await prisma.$queryRaw<Array<{
      student_id: bigint;
      joined_at: Date;
      left_at: Date;
      first_name: string;
      last_name: string;
      grade: any;
      combination: any;
      gender: 'male' | 'female' | null;
      student_created_at: Date;
    }>>`
      SELECT 
        cm.student_id,
        cm.joined_at,
        cm.left_at,
        s.first_name,
        s.last_name,
        s.grade,
        s.combination,
        s.gender,
        s.created_at as student_created_at
      FROM "club-members" cm
      INNER JOIN students s ON cm.student_id = s.id
      WHERE cm.club_id = ANY(${clubIds}::bigint[])
        AND cm.membership_status = 'left'
      ORDER BY cm.left_at DESC
    `;

    const serializedMembers = leftMembers.map((member) => {
      const avatarUrl = getAvatarUrl(member.gender || undefined, member.student_id);
      
      return {
        id: member.student_id.toString(),
        first_name: member.first_name,
        last_name: member.last_name,
        name: `${member.first_name} ${member.last_name}`,
        grade: member.grade,
        combination: member.combination,
        gender: member.gender,
        avatarUrl: avatarUrl,
        joined_at: member.joined_at.toISOString(),
        left_at: member.left_at.toISOString(),
      };
    });

    return NextResponse.json(serializedMembers);
  } catch (error) {
    console.error('[FETCH_LEFT_MEMBERS] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch left members' }, { status: 500 });
  }
}


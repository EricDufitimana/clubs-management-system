'use server';

import { NextResponse } from 'next/server';

import { requireRole } from 'src/utils/get-user-role';
import { createClient } from 'src/utils/supabase/server';

import { prisma } from 'src/lib/prisma';

export async function POST(request: Request) {
  try {
    // Check if user has permission (admin or super_admin)
    const authResult = await requireRole(['admin', 'super_admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentIds, clubId } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Please select at least one student' }, { status: 400 });
    }

    // Get the current user's club if clubId not provided
    let targetClubId: bigint;
    
    // If clubId not provided, get from current user
    if (!clubId) {
      const dbUser = await prisma.user.findUnique({
        where: { auth_user_id: user.id }
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
        return NextResponse.json({ error: 'You are not a leader of any club' }, { status: 403 });
      }

      targetClubId = clubLeader[0].club_id;
    } else {
      targetClubId = BigInt(clubId);
    }

    // Check which students are already members
    const existingMembers = await prisma.$queryRaw<Array<{
      student_id: bigint;
    }>>`
      SELECT student_id
      FROM "club-members"
      WHERE club_id = ${targetClubId}::bigint
        AND student_id = ANY(${studentIds.map((id: string) => BigInt(id))}::bigint[])
        AND membership_status = 'active'
    `;

    const existingStudentIds = new Set(existingMembers.map(m => m.student_id.toString()));
    const newStudentIds = studentIds.filter((id: string) => !existingStudentIds.has(id));

    if (newStudentIds.length === 0) {
      return NextResponse.json({ 
        error: 'All selected students are already members of this club',
        alreadyMembers: studentIds
      }, { status: 400 });
    }

    // Add new members
    const results = [];
    const errors = [];

    for (const studentId of newStudentIds) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "club-members" (club_id, student_id, membership_status, joined_at)
          VALUES (${targetClubId}::bigint, ${BigInt(studentId)}::bigint, 'active', NOW())
        `;
        results.push(studentId);
      } catch (error: any) {
        console.error(`[ADD_CLUB_MEMBER] Error adding student ${studentId}:`, error);
        errors.push({ studentId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      added: results,
      alreadyMembers: Array.from(existingStudentIds),
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully added ${results.length} student(s) to the club${existingStudentIds.size > 0 ? `. ${existingStudentIds.size} student(s) were already members.` : ''}`
    });
  } catch (error: any) {
    console.error('[ADD_CLUB_MEMBER] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to add club members' }, { status: 500 });
  }
}


'use server';

import { NextResponse } from 'next/server';

import { createClient } from 'src/utils/supabase/server';

import { prisma } from 'src/lib/prisma';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('club_id');

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
    }

    // Get all active members for this club
    const members = await prisma.$queryRaw<Array<{
      student_id: bigint;
    }>>`
      SELECT student_id
      FROM "club-members"
      WHERE club_id = ${BigInt(clubId)}::bigint
        AND membership_status = 'active'
    `;

    const memberIds = members.map(m => m.student_id.toString());

    return NextResponse.json({ memberIds });
  } catch (error: any) {
    console.error('[CHECK_CLUB_MEMBERS] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to check club members' }, { status: 500 });
  }
}


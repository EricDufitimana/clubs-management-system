'use server';
import { NextResponse } from 'next/server';
import {prisma} from 'src/lib/prisma'
import { createClient } from 'src/utils/supabase/server';
import { getAvatarUrl } from 'src/utils/get-avatar';

export async function GET(request: Request){
    try{
        const { searchParams } = new URL(request.url);
        const userIdParam = searchParams.get('user_id');
        
        let clubIds: bigint[] = [];
        
        // If user_id is provided, filter by clubs where that user is a leader
        if (userIdParam) {
            // Find the user by auth_user_id (the userIdParam is the Supabase auth user ID)
            // Add retry logic for connection issues
            let dbUser = null;
            let retries = 3;
            while (retries > 0) {
                try {
                    dbUser = await prisma.user.findUnique({
                        where: { auth_user_id: userIdParam }
                    });
                    break; // Success, exit retry loop
                } catch (error: any) {
                    retries--;
                    if (retries === 0 || !error.message?.includes('Can\'t reach database server')) {
                        throw error; // Re-throw if not a connection error or out of retries
                    }
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
                }
            }
            
            if (dbUser) {
                // Get club IDs where this user is a leader
                const userClubs = await prisma.$queryRaw<Array<{club_id: bigint}>>`
                    SELECT club_id 
                    FROM club_leaders 
                    WHERE user_id = ${dbUser.id}::bigint
                `;
                clubIds = userClubs.map(c => c.club_id);
            }
        }

        // Get club members for the clubs where this user is a leader
        let students: Array<{
            id: bigint;
            student_id: bigint | null;
            first_name: string;
            last_name: string;
            grade: any;
            combination: any;
            gender: 'male' | 'female' | null;
            created_at: Date;
        }> = [];

        // Map of student IDs to club names
        const studentClubMap = new Map<string, string>();
        const allMemberIds = new Set<string>();
        // Map to store student_id -> membership_status
        const studentStatusMap = new Map<string, 'active' | 'left'>();

        if (clubIds.length > 0) {
            // Get club names for mapping
            const clubs = await prisma.$queryRaw<Array<{
                id: bigint;
                club_name: string;
            }>>`
                SELECT id, club_name
                FROM clubs
                WHERE id = ANY(${clubIds}::bigint[])
            `;

            const clubNameMap = new Map<string, string>();
            clubs.forEach(club => {
                clubNameMap.set(club.id.toString(), club.club_name);
            });

            // Use the same query pattern as the club members check API
            
            for (const clubId of clubIds) {
                const members = await prisma.$queryRaw<Array<{
                    student_id: bigint;
                    membership_status: 'active' | 'left';
                }>>`
                    SELECT student_id, membership_status
                    FROM "club-members"
                    WHERE club_id = ${clubId}::bigint
                      AND membership_status = 'active'
                `;

                const clubName = clubNameMap.get(clubId.toString()) || '';
                members.forEach(member => {
                    const studentIdStr = member.student_id.toString();
                    allMemberIds.add(studentIdStr);
                    // Map student to club name (if multiple clubs, keep the first one found)
                    if (!studentClubMap.has(studentIdStr)) {
                        studentClubMap.set(studentIdStr, clubName);
                    }
                    // Store membership status (prefer active if multiple clubs)
                    if (!studentStatusMap.has(studentIdStr) || member.membership_status === 'active') {
                        studentStatusMap.set(studentIdStr, member.membership_status);
                    }
                });
            }

            // Get student details for all member IDs
            if (allMemberIds.size > 0) {
                const memberIdArray = Array.from(allMemberIds).map(id => BigInt(id));
                students = await prisma.student.findMany({
                    where: {
                        id: { in: memberIdArray }
                    }
                });
            }
        } else {
            // If no club filter, get all students from all clubs (for super admin)
            // First, get all active club members
            const allMembers = await prisma.$queryRaw<Array<{
                student_id: bigint;
                club_id: bigint;
                membership_status: 'active' | 'left';
            }>>`
                SELECT student_id, club_id, membership_status
                FROM "club-members"
                WHERE membership_status = 'active'
            `;

            // Get club names
            const allClubIds = [...new Set(allMembers.map(m => m.club_id.toString()))];
            if (allClubIds.length > 0) {
                const clubs = await prisma.$queryRaw<Array<{
                    id: bigint;
                    club_name: string;
                }>>`
                    SELECT id, club_name
                    FROM clubs
                    WHERE id = ANY(${allClubIds.map(id => BigInt(id))}::bigint[])
                `;

                const clubNameMap = new Map<string, string>();
                clubs.forEach(club => {
                    clubNameMap.set(club.id.toString(), club.club_name);
                });

                // Map students to clubs
                const studentIds = new Set<string>();
                allMembers.forEach(member => {
                    const studentIdStr = member.student_id.toString();
                    studentIds.add(studentIdStr);
                    const clubName = clubNameMap.get(member.club_id.toString()) || '';
                    // Map student to club name (if multiple clubs, keep the first one found)
                    if (!studentClubMap.has(studentIdStr)) {
                        studentClubMap.set(studentIdStr, clubName);
                    }
                    // Store membership status (prefer active if multiple clubs)
                    if (!studentStatusMap.has(studentIdStr) || member.membership_status === 'active') {
                        studentStatusMap.set(studentIdStr, member.membership_status);
                    }
                });

                // Get student details for all member IDs
                if (studentIds.size > 0) {
                    const memberIdArray = Array.from(studentIds).map(id => BigInt(id));
                    students = await prisma.student.findMany({
                        where: {
                            id: { in: memberIdArray }
                        }
                    });
                }
            } else {
                // No club members found, return empty array
                students = [];
            }
        }

        const serializedStudents = students.map((student) => {
            const clubName = studentClubMap.get(student.id.toString()) || null;
            const avatarUrl = getAvatarUrl(student.gender || undefined, student.id);
            const membershipStatus = studentStatusMap.get(student.id.toString()) || 'active';
            
            return {
                id: student.id.toString(),
                student_id: student.student_id ? student.student_id.toString() : null,
                first_name: student.first_name,
                last_name: student.last_name,
                grade: student.grade,
                combination: student.combination,
                gender: student.gender,
                created_at: student.created_at.toISOString(),
                club_name: clubName,
                avatarUrl: avatarUrl,
                membership_status: membershipStatus
            };
        });
         
        console.log('[FETCH_STUDENTS] Serialized students:', serializedStudents);
        // Return empty array instead of 404 when no students found
        return NextResponse.json(serializedStudents);
    }
    catch(error){
        console.error('[FETCH_STUDENTS] Error fetching students:', error);
        return NextResponse.json({error: 'Failed to fetch students'}, {status: 500});
    }
}
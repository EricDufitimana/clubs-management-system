'use server';
import { NextResponse } from 'next/server';
import { prisma } from 'src/lib/prisma';
import { getAvatarUrl } from 'src/utils/get-avatar';

export async function GET(Request: Request) {
    try {
        // Fetch users with club information in a single query using LEFT JOIN
        const usersWithClubs = await prisma.$queryRaw<Array<{
            id: bigint;
            auth_user_id: string | null;
            first_name: string;
            last_name: string;
            role: string;
            created_at: Date;
            club_name: string | null;
        }>>`
            SELECT DISTINCT ON (u.id)
                u.id,
                u.auth_user_id,
                u.first_name,
                u.last_name,
                u.role::text as role,
                u.created_at,
                c.club_name
            FROM users u
            LEFT JOIN club_leaders cl ON u.id = cl.user_id
            LEFT JOIN clubs c ON cl.club_id = c.id
            ORDER BY u.id, cl.created_at DESC NULLS LAST
        `;

        const serializedUsers = usersWithClubs.map((user) => {
            const avatarUrl = getAvatarUrl(undefined, user.id); // No gender field yet, use ID for deterministic selection
            console.log('[FETCH_USERS] User:', user.first_name, user.last_name, 'ID:', user.id.toString(), 'Avatar URL:', avatarUrl);
            return {
                id: user.id.toString(),
                auth_user_id: user.auth_user_id || null,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role as 'admin' | 'super_admin',
                created_at: user.created_at.toISOString(),
                club_name: user.club_name || null,
                avatarUrl,
            };
        });

        if (!serializedUsers || serializedUsers.length === 0) {
            return NextResponse.json({ error: 'No users found' }, { status: 404 });
        }

        return NextResponse.json(serializedUsers);
    } catch (error) {
        console.error('[FETCH_USERS] Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}


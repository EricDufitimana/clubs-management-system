import { NextResponse } from 'next/server';

import {prisma} from 'src/lib/prisma';

export async function GET(request: Request) {
    console.log('[FETCH_CLUBS] Starting to fetch clubs...');
    try{
        const clubs = await prisma.club.findMany({
            orderBy: {
                created_at: 'desc',
            },
        });

        console.log('[FETCH_CLUBS] Successfully fetched', clubs.length, 'clubs');
        // Convert BigInt to string for JSON serialization
        const serializedClubs = clubs.map(club => ({
            ...club,
            id: club.id.toString()
        }));
        return NextResponse.json(serializedClubs);    
    }
    catch(error){
        console.error('[FETCH_CLUBS] Error fetching clubs:', error);
        return NextResponse.json({error: 'Failed to fetch clubs'}, {status: 500});
    }
}

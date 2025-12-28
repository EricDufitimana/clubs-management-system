'use server'

import { prisma } from '../lib/prisma'
import { createClient } from '../utils/supabase/server'

export async function activateClub(clubId: string){
    console.log('[ACTIVATE_CLUB] Starting club activation process...');
    const supabase = await createClient()
    
    try{
        // Get current user session
        console.log('[ACTIVATE_CLUB] Getting current user session...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.log('[ACTIVATE_CLUB] Error getting user session:', authError?.message);
            return {error: 'You must be logged in to activate a club'}
        }
        
        console.log('[ACTIVATE_CLUB] Current user:', user.email);
        console.log('[ACTIVATE_CLUB] Club ID:', clubId);
        
        console.log('[ACTIVATE_CLUB] Attempting to activate club in database...');
        const club = await prisma.club.update({
            where: {
                id: BigInt(clubId)
            },
            data: {
                status: 'active'
            }
        })
        
        console.log('[ACTIVATE_CLUB] Club activated successfully! ID:', club.id);
        console.log('[ACTIVATE_CLUB] Club status:', club.status);
        return {success: true, message: 'Club activated successfully'}
    }
    catch(error){
        console.error('[ACTIVATE_CLUB] Error occurred:', error);
        return {error: 'An error occurred while activating the club'}
    }
   
}


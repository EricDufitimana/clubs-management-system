'use server'

import { prisma } from '../lib/prisma'
import { createClient } from '../utils/supabase/server'

export async function deactivateClub(clubId: string){
    console.log('[DEACTIVATE_CLUB] Starting club deactivation process...');
    const supabase = await createClient()
    
    try{
        // Get current user session
        console.log('[DEACTIVATE_CLUB] Getting current user session...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.log('[DEACTIVATE_CLUB] Error getting user session:', authError?.message);
            return {error: 'You must be logged in to deactivate a club'}
        }
        
        console.log('[DEACTIVATE_CLUB] Current user:', user.email);
        console.log('[DEACTIVATE_CLUB] Club ID:', clubId);
        
        console.log('[DEACTIVATE_CLUB] Attempting to deactivate club in database...');
        const club = await prisma.club.update({
            where: {
                id: BigInt(clubId)
            },
            data: {
                status: 'terminated'
            }
        })
        
        console.log('[DEACTIVATE_CLUB] Club deactivated successfully! ID:', club.id);
        console.log('[DEACTIVATE_CLUB] Club status:', club.status);
        return {success: true, message: 'Club deactivated successfully'}
    }
    catch(error){
        console.error('[DEACTIVATE_CLUB] Error occurred:', error);
        return {error: 'An error occurred while deactivating the club'}
    }
   
}


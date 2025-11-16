'use server'

import { prisma } from '../lib/prisma'
import { createClient } from '../utils/supabase/server'

export async function editClub(clubId: string, formData: FormData){
    console.log('[EDIT_CLUB] Starting club update process...');
    const supabase = await createClient()
    
    try{
        // Get current user session
        console.log('[EDIT_CLUB] Getting current user session...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.log('[EDIT_CLUB] Error getting user session:', authError?.message);
            return {error: 'You must be logged in to edit a club'}
        }
        
        console.log('[EDIT_CLUB] Current user:', user.email);
        
        const club_name = formData.get('name') as string;
        const club_description = formData.get('description') as string;
        
        console.log('[EDIT_CLUB] Club ID:', clubId);
        console.log('[EDIT_CLUB] Club name:', club_name);
        console.log('[EDIT_CLUB] Club description:', club_description);
        
        if(!club_name || !club_description){
            console.log('[EDIT_CLUB] Missing required fields');
            return {error: 'All fields are required'}
        }
        
        console.log('[EDIT_CLUB] Attempting to update club in database...');
        const club = await prisma.club.update({
            where: {
                id: BigInt(clubId)
            },
            data: {
                club_name,
                club_description,
            }
        })
        
        console.log('[EDIT_CLUB] Club updated successfully! ID:', club.id);
        console.log('[EDIT_CLUB] Club name:', club.club_name);
        return {success: true, message: 'Club updated successfully'}
    }
    catch(error){
        console.error('[EDIT_CLUB] Error occurred:', error);
        return {error: 'An error occurred while updating the club'}
    }
   
}


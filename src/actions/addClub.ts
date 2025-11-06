'use server'
import { createClient } from '../utils/supabase/server'
import { prisma } from '../lib/prisma'

export async function addClub(formData: FormData){
    console.log('[ADD_CLUB] Starting club creation process...');
    const supabase = await createClient()
    
    try{
        // Get current user session
        console.log('[ADD_CLUB] Getting current user session...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.log('[ADD_CLUB] Error getting user session:', authError?.message);
            return {error: 'You must be logged in to create a club'}
        }
        
        console.log('[ADD_CLUB] Current user:', user.email);
        console.log('[ADD_CLUB] User metadata:', user.user_metadata);
        
        // Get user's display name or construct from metadata
        const displayName = user.user_metadata?.display_name || 
                          `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
                          user.email?.split('@')[0] ||
                          'Unknown User';
        
        console.log('[ADD_CLUB] Created by:', displayName);
        
        const club_name = formData.get('name') as string;
        const club_description = formData.get('description') as string;
        
        console.log('[ADD_CLUB] Club name:', club_name);
        console.log('[ADD_CLUB] Club description:', club_description);
        
        const data = {
            club_name,
            club_description,
            created_by: displayName,
            user_id: user.id,
        }
        
        if(!data.club_name || !data.club_description){
            console.log('[ADD_CLUB] Missing required fields');
            return {error: 'All fields are required'}
        }
        
        console.log('[ADD_CLUB] Attempting to create club in database...');
        const club = await prisma.club.create({
            data: {
                club_name: data.club_name,
                club_description: data.club_description,
                created_by: data.created_by,
            }
        })
        
        console.log('[ADD_CLUB] Club created successfully! ID:', club.id);
        console.log('[ADD_CLUB] Club name:', club.club_name);
        console.log('[ADD_CLUB] Created by:', club.created_by);
        return {success: true, message: 'Club created successfully'}
    }
    catch(error){
        console.error('[ADD_CLUB] Error occurred:', error);
        return {error: 'An error occurred while adding the club'}
    }
   
}
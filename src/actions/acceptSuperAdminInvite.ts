'use server';

import { prisma } from '../lib/prisma';
import { createClient } from '../utils/supabase/server';

export async function acceptSuperAdminInvite(token: string) {
  const supabase = await createClient();
  
  try {
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'You must be logged in to accept an invitation' };
    }

    // Find the invite by token
    const invite = await prisma.superAdminInvite.findUnique({
      where: { token }
    });

    if (!invite) {
      return { error: 'Invalid invitation token' };
    }

    // Check if invite has expired
    if (new Date() > invite.expires_at) {
      return { error: 'This invitation has expired' };
    }

    // Check if invite has already been used
    if (invite.used_at) {
      return { error: 'This invitation has already been used' };
    }

    // Find or create user in users table
    let dbUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id }
    });

    if (!dbUser) {
      // Create user if they don't exist
      dbUser = await prisma.user.create({
        data: {
          auth_user_id: user.id,
          first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Super',
          last_name: user.user_metadata?.last_name || 'Admin',
          role: 'super_admin'
        }
      });
    } else {
      // Update existing user to super admin role
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { role: 'super_admin' }
      });
    }

    // Mark invite as used AFTER successfully updating the user
    await prisma.superAdminInvite.update({
      where: { id: invite.id },
      data: { used_at: new Date() }
    });

    return { 
      success: true, 
      message: 'Successfully joined as Super Administrator',
      userId: dbUser.id.toString()
    };
  } catch (error: any) {
    console.error('[ACCEPT_SUPER_ADMIN_INVITE] Error:', error);
    
    return { error: 'Failed to accept invitation' };
  }
}

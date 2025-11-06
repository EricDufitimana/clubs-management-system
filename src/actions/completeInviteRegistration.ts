'use server';
import { prisma } from '../lib/prisma';
import { createClient } from '../utils/supabase/server';

export async function completeInviteRegistration(
  token: string,
  formData: FormData
) {
  const supabase = await createClient();
  
  try {
    // 1. Validate invite first (before any user operations)
    const invite = await prisma.clubInvite.findUnique({
      where: { token }
    });

    if (!invite) {
      return { error: 'Invalid invitation token' };
    }

    // Fetch club info separately since there's no relation defined
    const club = await prisma.club.findUnique({
      where: { id: invite.club_id }
    });

    if (!club) {
      return { error: 'Club not found' };
    }

    if (new Date() > invite.expires_at) {
      return { error: 'This invitation has expired' };
    }

    if (invite.used_at) {
      return { error: 'This invitation has already been used' };
    }

    // 2. Get and validate form data
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!first_name || !last_name || !email || !password) {
      return { error: 'All fields are required' };
    }

    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters' };
    }

    // Verify email matches invite email
    if (email.toLowerCase() !== invite.email.toLowerCase()) {
      return { error: 'Email must match the invitation email' };
    }

    // 3. Sign up the user
    console.log('[INVITE_REGISTRATION] Creating new user account...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          display_name: `${first_name.trim()} ${last_name.trim()}`.trim()
        }
      }
    });

    if (signUpError) {
      console.error('[INVITE_REGISTRATION] Signup error:', signUpError);
      return { error: signUpError.message || 'Failed to create account' };
    }

    if (!signUpData.user) {
      return { error: 'Failed to create user account' };
    }

    const authUserId = signUpData.user.id;
    console.log('[INVITE_REGISTRATION] User created with ID:', authUserId);

    // 4. Create user in users table
    console.log('[INVITE_REGISTRATION] Creating user record in database...');
    const dbUser = await prisma.user.create({
      data: {
        auth_user_id: authUserId,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        role: 'admin' // Default role for club officers
      }
    });

    console.log('[INVITE_REGISTRATION] User record created with ID:', dbUser.id);

    // 5. Create club leader record
    console.log('[INVITE_REGISTRATION] Adding user as club leader...');
    
    // Convert Prisma enum to database enum
    const dbRoleValue = invite.role === 'vice_president' ? 'vice-president' : invite.role;

    await prisma.$executeRaw`
      INSERT INTO club_leaders (club_id, user_id, role, created_at)
      VALUES (${invite.club_id}::bigint, ${dbUser.id}::bigint, ${dbRoleValue}::role, NOW())
    `;

    console.log('[INVITE_REGISTRATION] Club leader record created');

    // 6. Mark invite as used
    await prisma.clubInvite.update({
      where: { id: invite.id },
      data: { used_at: new Date() }
    });

    console.log('[INVITE_REGISTRATION] Invite marked as used');

    // Format role name for display
    const roleDisplayName = invite.role === 'vice_president' 
      ? 'Vice President' 
      : invite.role.charAt(0).toUpperCase() + invite.role.slice(1);

    return { 
      success: true, 
      message: `Account created! You've joined ${club.club_name} as ${roleDisplayName}`,
      clubId: invite.club_id.toString(),
      userId: authUserId
    };

  } catch (error: any) {
    console.error('[INVITE_REGISTRATION] Error:', error);
    
    // Handle specific error cases
    if (error.code === 'P2002') {
      return { error: 'An account with this email already exists' };
    }
    
    if (error.message?.includes('duplicate')) {
      return { error: 'You are already registered for this club' };
    }
    
    return { error: 'Failed to complete registration. Please try again.' };
  }
}
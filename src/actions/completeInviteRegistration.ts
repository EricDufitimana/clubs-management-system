'use server';

import { prisma } from '../lib/prisma';
import { createClient } from '../utils/supabase/server';

export async function completeInviteRegistration(
  token: string,
  formData: FormData
) {
  const supabase = await createClient();
  
  let dbUser: any;
  let authUserId: string;
  let isNewUser: boolean;
  
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

    // 3. Check if user already exists in database tables first
    console.log('[INVITE_REGISTRATION] Checking for existing user in database...');
    
    // Check if user exists in users table (no email field in User model, so check by name only)
    const existingDbUser = await prisma.user.findFirst({
      where: { 
        first_name,
        last_name
      }
    });

    if (existingDbUser) {
      console.log('[INVITE_REGISTRATION] Found existing user in database:', existingDbUser.id);
      
      // Check if user is already a leader for this club
      const existingLeader = await prisma.$queryRaw<Array<{id: bigint}>>`
        SELECT id FROM club_leaders 
        WHERE club_id = ${invite.club_id}::bigint 
        AND user_id = ${existingDbUser.id}::bigint
      `;

      if (existingLeader && existingLeader.length > 0) {
        // User is in both users table AND club_leaders table for this club
        console.log('[INVITE_REGISTRATION] User is already registered as a leader of this club');
        
        // Mark invite as used if not already used
        if (!invite.used_at) {
          await prisma.clubInvite.update({
            where: { id: invite.id },
            data: { used_at: new Date() }
          });
        }
        
        return {
          success: true,
          message: `You are already registered as a leader of ${club.club_name}`,
          clubId: invite.club_id.toString(),
          userId: existingDbUser.auth_user_id,
          alreadyRegistered: true
        };
      }

      console.log('[INVITE_REGISTRATION] User exists in users table but not in club_leaders - adding leadership...');
      // User exists in users table but not in club_leaders for this club
      // Continue to add them to club_leaders table below
      dbUser = existingDbUser;
      authUserId = existingDbUser.auth_user_id!;
      isNewUser = false;
    } else {
      // User doesn't exist in database, check if they exist in Supabase Auth
      console.log('[INVITE_REGISTRATION] User not in database, checking Supabase Auth...');
      const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = existingAuthUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (existingAuthUser) {
        // User exists in Supabase Auth but not in database - create database record
        console.log('[INVITE_REGISTRATION] Found existing auth user, creating database record...');
        authUserId = existingAuthUser.id;
        
        dbUser = await prisma.user.create({
          data: {
            auth_user_id: authUserId,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            role: 'admin'
          }
        });
        
        console.log('[INVITE_REGISTRATION] Database record created for existing auth user');
        isNewUser = false;
      } else {
        // New user - create everything
        console.log('[INVITE_REGISTRATION] Creating new user account...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
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

        authUserId = signUpData.user.id;
        console.log('[INVITE_REGISTRATION] User created with ID:', authUserId);

        // Create user in users table
        dbUser = await prisma.user.create({
          data: {
            auth_user_id: authUserId,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            role: 'admin'
          }
        });

        console.log('[INVITE_REGISTRATION] User record created with ID:', dbUser.id);
        isNewUser = true;
      }
    }

    // Create club leader record
    console.log('[INVITE_REGISTRATION] Adding user as club leader...');
    
    // Default role if none specified
    const role = invite.role || 'secretary';
    
    // Convert Prisma enum to database enum
    const dbRoleValue = role === 'vice_president' ? 'vice-president' : role;

    await prisma.$executeRaw`
      INSERT INTO club_leaders (club_id, user_id, role, created_at)
      VALUES (${invite.club_id}::bigint, ${dbUser.id}::bigint, ${dbRoleValue}, NOW())
    `;

    console.log('[INVITE_REGISTRATION] Club leader record created');

    // Mark invite as used
    await prisma.clubInvite.update({
      where: { id: invite.id },
      data: { used_at: new Date() }
    });

    console.log('[INVITE_REGISTRATION] Invite marked as used');

    // Format role name for display
    const roleDisplayName = role === 'vice_president' 
      ? 'Vice President' 
      : role.charAt(0).toUpperCase() + role.slice(1);

    const message = isNewUser 
      ? `Account created! You've joined ${club.club_name} as ${roleDisplayName}`
      : `You've been added to ${club.club_name} as ${roleDisplayName}`;

    return { 
      success: true, 
      message,
      clubId: invite.club_id.toString(),
      userId: authUserId,
      isNewUser
    };

  } catch (error: any) {
    console.error('[INVITE_REGISTRATION] Error:', error);
    
    // Handle specific error cases
    if (error.code === 'P2002') {
      // Check if it's a duplicate club_leaders entry
      if (error.meta?.target?.includes('user_id') && error.meta?.target?.includes('club_id')) {
        return { error: 'You are already a leader of this club' };
      }
    }
    
    if (error.message?.includes('duplicate')) {
      return { error: 'You are already a leader of this club' };
    }
    
    return { error: 'Failed to complete registration. Please try again.' };
  }
}
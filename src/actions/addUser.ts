'use server';

import { prisma } from '../lib/prisma';
import { requireRole } from '../utils/get-user-role';
import { createClient } from '../utils/supabase/server';

export async function addUser(formData: FormData) {
  console.log('[ADD_USER] Starting user creation process...');
  
  // Check if user has permission (admin or super_admin)
  const authResult = await requireRole(['admin', 'super_admin']);
  if ('error' in authResult) {
    return { error: authResult.error };
  }

  const supabase = await createClient();
  
  try {
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = (formData.get('role') as 'admin' | 'super_admin') || 'admin';

    // Validate inputs
    if (!first_name || !last_name || !email || !password) {
      return { error: 'All fields are required' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { error: 'Please enter a valid email address' };
    }

    // Validate password length
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters long' };
    }

    // Check if user already exists in database
    const existingDbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { auth_user_id: { not: null } },
        ],
      },
    });

    // Create user in Supabase Auth
    console.log('[ADD_USER] Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: undefined, // Admin-created users don't need email confirmation redirect
        data: {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          display_name: `${first_name.trim()} ${last_name.trim()}`.trim(),
        },
      },
    });

    if (authError) {
      console.error('[ADD_USER] Auth error:', authError);
      // Handle specific error cases
      if (authError.message.includes('already registered') || 
          authError.message.includes('already exists') ||
          authError.message.includes('already been registered')) {
        return { error: 'A user with this email already exists' };
      }
      return { error: authError.message || 'Failed to create user account' };
    }

    if (!authData.user) {
      console.error('[ADD_USER] No user returned from signUp');
      return { error: 'Failed to create user account. Please check your Supabase configuration.' };
    }

    // Create user in database
    console.log('[ADD_USER] Creating user in database...');
    try {
      const dbUser = await prisma.user.create({
        data: {
          auth_user_id: authData.user.id,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          role: role as 'admin' | 'super_admin',
        },
      });

      console.log('[ADD_USER] User created successfully! ID:', dbUser.id, 'Role:', role);
      return { 
        success: true, 
        message: `User "${first_name.trim()} ${last_name.trim()}" created successfully with role: ${role === 'super_admin' ? 'Super Admin' : 'Admin'}` 
      };
    } catch (dbError: any) {
      console.error('[ADD_USER] Database error:', dbError);
      
      // If database insert fails, try to clean up the auth user
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('[ADD_USER] Cleaned up auth user after database error');
      } catch (cleanupError) {
        console.error('[ADD_USER] Failed to cleanup auth user:', cleanupError);
      }

      // Check for duplicate key error
      if (dbError.code === 'P2002' || dbError.message?.includes('Unique constraint')) {
        return { error: 'A user with this information already exists' };
      }

      return { error: 'Failed to save user to database. Please try again.' };
    }
  } catch (error: any) {
    console.error('[ADD_USER] Unexpected error occurred:', error);
    return { error: error?.message || 'An error occurred while adding the user' };
  }
}


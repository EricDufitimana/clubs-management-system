'use server'

import {revalidatePath} from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '../utils/supabase/server'
import { getCurrentUserRole } from '../utils/get-user-role'

export async function login(FormData: FormData){
    console.log('[LOGIN] Starting login process...');
    const supabase = await createClient()

    try{
        const email = FormData.get('email') as string;
        const password = FormData.get('password') as string;
        
        console.log('[LOGIN] Email:', email);
        console.log('[LOGIN] Password provided:', !!password);
        
        const data = {
            email,
            password,
        }
        
        if(!data.email || !data.password){
            console.log('[LOGIN] Missing email or password');
            return {error: 'Email and password are required'}
        }
        
        console.log('[LOGIN] Attempting to sign in with Supabase...');
        const {data: authData, error} = await supabase.auth.signInWithPassword(data)
        
        if(error){
            console.log('[LOGIN] Error from Supabase:', error.message);
            return {error: error.message}
        }
        
        console.log('[LOGIN] Success! User authenticated:', authData.user?.email);
        
        // Get user role to determine redirect destination
        const role = await getCurrentUserRole();
        console.log('[LOGIN] User role:', role);
        
        // Determine redirect path based on role
        let redirectPath = '/dashboard';
        if (role === 'super_admin') {
            redirectPath = '/dashboard/super-admin';
        } else if (role === 'admin') {
            redirectPath = '/dashboard/admin';
        }
        
        console.log('[LOGIN] Revalidating path and redirecting to:', redirectPath);
        revalidatePath('/')
        redirect(redirectPath)
    } catch (error: any) {
        // Redirect throws a special error that should be re-thrown
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            throw error; // Re-throw redirect errors so Next.js can handle them
        }
        console.error('[LOGIN] Exception occurred:', error);
        return {error: 'An error occurred while logging in'}
    }
}

export async function signup(FormData: FormData){
    console.log('[SIGNUP] Starting signup process...');
    const supabase = await createClient()

    try{
        const first_name = FormData.get('first_name') as string;
        const last_name = FormData.get('last_name') as string;
        const email = FormData.get('email') as string;
        const password = FormData.get('password') as string;
        
        console.log('[SIGNUP] First name:', first_name);
        console.log('[SIGNUP] Last name:', last_name);
        console.log('[SIGNUP] Email:', email);
        console.log('[SIGNUP] Password provided:', !!password);
        
        const data = {
            first_name,
            last_name,
            email,
            password,
        }
        
        if(!data.email || !data.password || !data.first_name || !data.last_name){
            console.log('[SIGNUP] Missing required fields');
            return {error: 'All fields are required'}
        }
        
        // Combine first and last name for display name
        const display_name = `${data.first_name} ${data.last_name}`.trim();
        console.log('[SIGNUP] Display name:', display_name);
        
        console.log('[SIGNUP] Attempting to sign up with Supabase...');
        const {data: authData, error} = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    display_name,
                }
            }
        })
        
        if(error){
            console.log('[SIGNUP] Error from Supabase:', error.message);
            return {error: error.message}
        }
        
        console.log('[SIGNUP] Success! Account created for:', authData.user?.email);
        console.log('[SIGNUP] User ID:', authData.user?.id);
        console.log('[SIGNUP] Display name set in metadata:', authData.user?.user_metadata?.display_name);
        
        // Insert user into users table
        if (authData.user?.id) {
            console.log('[SIGNUP] Inserting user into users table...');
            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    user_id: authData.user.id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    role: 'admin' // Default role is admin
                });
            
            if (dbError) {
                console.error('[SIGNUP] Error inserting user into database:', dbError.message);
                // Don't fail the signup if database insert fails, but log it
                // You might want to handle this differently based on your requirements
            } else {
                console.log('[SIGNUP] User successfully inserted into users table');
            }
        }
        
        // Update the user's display name if needed
        if (authData.user) {
            console.log('[SIGNUP] Updating user display name...');
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    display_name
                }
            });
            
            if (updateError) {
                console.log('[SIGNUP] Warning: Could not update display name:', updateError.message);
            } else {
                console.log('[SIGNUP] Display name updated successfully');
            }
        }
        
        console.log('[SIGNUP] Revalidating path...');
        revalidatePath('/')
        
        // Return success - redirect will be handled on client side after toast
        return {success: true, message: 'Account created successfully!'}
    } catch (error) {
        console.error('[SIGNUP] Exception occurred:', error);
        return {error: 'An error occurred while signing up'}
    }
}
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { baseProcedure, createTRPCRouter } from '../init';
 
export const authRouter = createTRPCRouter({
    // Get current user from context (no DB query needed)
    getCurrentUser: baseProcedure.query(({ ctx }) => {
        return {
            userId: ctx.user?.auth_user_id || null,
            role: ctx.role,
            clubs: ctx.clubs,
        };
    }),

    logout: baseProcedure.mutation(async () => {
        const supabase = await createClient();
        const {error} = await supabase.auth.signOut();
        if (error) {
            console.error('[AUTH] Logout error:', error.message);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to logout',
            });
        }
        return { success: true };
    }),

    login: baseProcedure
    .input(
        z.object({
            email: z.string().email("Invalid email address"),
            password: z.string().min(8, "Password must be at least 8 characters long"),
        })

    )
    .mutation(async({input})=> {
        const supabase = await createClient();
        try{
            const {email, password} = input;
            console.log('[AUTH] Login attempt for:', email);
            
            const {data: authData, error} = await supabase.auth.signInWithPassword({
                email, 
                password, 
            })
            
            if (error) {
                console.log('[AUTH] Login failed:', error.message);
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: error.message,
                })
            }
            
            console.log('[AUTH] Authentication successful for:', authData.user?.email);
            
            // Get user role from database
            const dbUser = await prisma.user.findUnique({
              where: { auth_user_id: authData.user.id },
              select: { role: true },
            });
            
            // Handle case where user doesn't exist in database
            if (!dbUser) {
                console.log('[AUTH] User not found in database for auth_user_id:', authData.user.id);
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User account not found. Please contact support.',
                });
            }
            
            // Validate role against allowed values
            const allowedRoles = ['admin', 'super_admin'] as const;
            type AllowedRole = typeof allowedRoles[number];
            
            let role: AllowedRole | null = null;
            if (dbUser.role && allowedRoles.includes(dbUser.role as AllowedRole)) {
                role = dbUser.role as AllowedRole;
            } else if (dbUser.role) {
                // Log warning for unexpected role values
                console.warn('[AUTH] Unexpected role value found:', dbUser.role, 'for user:', authData.user.id);
                role = null;
            }
            
            console.log('[AUTH] User role determined:', role);
            
            let redirectPath = '/dashboard';
            if (role === 'super_admin') {
                redirectPath = '/dashboard/super-admin';
            } else if (role === 'admin') {
                redirectPath = '/dashboard/admin';
            }
            
            console.log('[AUTH] Login successful, returning redirect path:', redirectPath);
            revalidatePath('/');
            
            return {
                success: true,
                redirectPath,
                user: {
                  email: authData.user?.email,
                  role,
                },
              };
        } catch (error: any) {
            console.error('[AUTH] Login error:', error);
            // If it's already a TRPCError, rethrow it unchanged to preserve auth error messages
            if (error instanceof TRPCError) {
                throw error;
            }
            // Only wrap unknown errors as INTERNAL_SERVER_ERROR
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to login",
            })
        }
    })
})


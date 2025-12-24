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
        await supabase.auth.signOut();
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
            
            const role = dbUser?.role as 'admin' | 'super_admin' | null;
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
              };        } catch (error: any) {
            console.error('[AUTH] Login error:', error);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to login",
            })
        }
    })
})


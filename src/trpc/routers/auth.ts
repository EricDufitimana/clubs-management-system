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

    // Get current user profile with full details
    getUserProfile: baseProcedure.query(async ({ ctx }) => {
        try {
            const supabase = await createClient();
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !authUser) {
                return {
                    id: null,
                    email: null,
                    first_name: null,
                    last_name: null,
                    avatarUrl: null,
                };
            }

            // If user is in database, return database user data
            if (ctx.user) {
                const dbUser = await prisma.user.findUnique({
                    where: { auth_user_id: authUser.id },
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                });

                if (dbUser) {
                    return {
                        id: dbUser.id.toString(),
                        email: authUser.email || null,
                        first_name: dbUser.first_name,
                        last_name: dbUser.last_name,
                        avatarUrl: `/assets/images/avatar/avatar-${(Number(dbUser.id) % 24) + 1}.webp`,
                    };
                }
            }

            // Fallback to auth user metadata
            return {
                id: authUser.id,
                email: authUser.email || null,
                first_name: authUser.user_metadata?.first_name || null,
                last_name: authUser.user_metadata?.last_name || null,
                avatarUrl: authUser.user_metadata?.avatar_url || null,
            };
        } catch (error: any) {
            console.error('[AUTH] Error fetching user profile:', error);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to fetch user profile',
            });
        }
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
    }),

    signup: baseProcedure
        .input(
            z.object({
                first_name: z.string().min(1, "First name is required"),
                last_name: z.string().min(1, "Last name is required"),
                email: z.string().email("Invalid email address"),
                password: z.string().min(6, "Password must be at least 6 characters long"),
            })
        )
        .mutation(async ({ input }) => {
            const supabase = await createClient();
            try {
                const { first_name, last_name, email, password } = input;
                console.log('[AUTH] Signup attempt for:', email);

                // Combine first and last name for display name
                const display_name = `${first_name} ${last_name}`.trim();

                const { data: authData, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name,
                            last_name,
                            display_name,
                        }
                    }
                });

                if (error) {
                    console.log('[AUTH] Signup failed:', error.message);
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: error.message,
                    });
                }

                console.log('[AUTH] Signup successful for:', authData.user?.email);

                // Insert user into users table
                if (authData.user?.id) {
                    console.log('[AUTH] Inserting user into users table...');
                    const { error: dbError } = await supabase
                        .from('users')
                        .insert({
                            user_id: authData.user.id,
                            first_name,
                            last_name,
                            role: 'admin' // Default role is admin
                        });

                    if (dbError) {
                        console.error('[AUTH] Error inserting user into database:', dbError.message);
                        // Don't fail the signup if database insert fails, but log it
                    } else {
                        console.log('[AUTH] User successfully inserted into users table');
                    }
                }

                // Update the user's display name if needed
                if (authData.user) {
                    console.log('[AUTH] Updating user display name...');
                    const { error: updateError } = await supabase.auth.updateUser({
                        data: {
                            display_name
                        }
                    });

                    if (updateError) {
                        console.log('[AUTH] Warning: Could not update display name:', updateError.message);
                    } else {
                        console.log('[AUTH] Display name updated successfully');
                    }
                }

                revalidatePath('/');

                return {
                    success: true,
                    message: 'Account created successfully!',
                    user: {
                        email: authData.user?.email,
                    },
                };
            } catch (error: any) {
                console.error('[AUTH] Signup error:', error);
                if (error instanceof TRPCError) {
                    throw error;
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to sign up",
                });
            }
        }),
})


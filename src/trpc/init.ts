import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import superjson from 'superjson';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

type User = {
  id: bigint;
  auth_user_id: string;
  role: 'admin' | 'super_admin' | null;
};

type Club = {
  id: bigint;
  club_name: string;
  club_description: string;
  status: 'active' | 'terminated';
};

type Context = {
  user: User | null;
  role: 'admin' | 'super_admin' | null;
  clubs: Club[]; // Clubs the user is leading (for admin) or all active clubs (for super_admin)
  clubIds: bigint[]; // Just the IDs for convenience
};

export const createTRPCContext = cache(async (): Promise<Context> => {
  /**
   * @see: https://trpc.io/docs/server/context
   * 
   * This context is shared across all tRPC procedures
   * We fetch the user and role once here instead of in every procedure
   */
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return { user: null, role: null, clubs: [], clubIds: [] };
    }

    const dbUser = await prisma.user.findUnique({
      where: { auth_user_id: authUser.id },
      select: {
        id: true,
        auth_user_id: true,
        role: true,
      },
    });

    // Debug: Check if there are multiple users with same auth_user_id
    const allUsersWithSameAuth = await prisma.user.findMany({
      where: { auth_user_id: authUser.id },
      select: {
        id: true,
        auth_user_id: true,
        first_name: true,
        last_name: true,
        role: true,
      },
    });
    
    console.log('[TRPC_CONTEXT] Auth user ID:', authUser.id);
    console.log('[TRPC_CONTEXT] All users with this auth_user_id:', allUsersWithSameAuth);
    console.log('[TRPC_CONTEXT] Selected dbUser:', dbUser);

    if (!dbUser) {
      return { user: null, role: null, clubs: [], clubIds: [] };
    }

    const role = dbUser.role as 'admin' | 'super_admin' | null;
    let clubs: Club[] = [];
    let clubIds: bigint[] = [];

    // Fetch clubs based on role
    if (role === 'super_admin') {
      // Super admin gets all active clubs
      const allClubs = await prisma.$queryRaw<Array<{
        id: bigint;
        club_name: string;
        club_description: string;
        status: string;
      }>>`
        SELECT id, club_name, club_description, status::text as status
        FROM clubs
        WHERE status = 'active'
        ORDER BY club_name ASC
      `;
      clubs = allClubs.map(c => ({
        id: c.id,
        club_name: c.club_name,
        club_description: c.club_description,
        status: c.status as 'active' | 'terminated',
      }));
      clubIds = clubs.map(c => c.id);
    } else if (role === 'admin') {
      // Admin gets only clubs where they are a leader
      console.log('[TRPC_CONTEXT] Admin user detected, fetching clubs for user ID:', dbUser.id);
      console.log('[TRPC_CONTEXT] User ID type:', typeof dbUser.id, 'value:', dbUser.id.toString());
      
      // First check what clubs this user is leader of, regardless of status
      const userClubsWithStatus = await prisma.$queryRaw<Array<{
        club_id: bigint;
        club_name: string;
        club_status: string;
        leader_role: string;
      }>>`
        SELECT cl.club_id, c.club_name, c.status as club_status, cl.role as leader_role
        FROM club_leaders cl
        JOIN clubs c ON cl.club_id = c.id
        WHERE cl.user_id = ${dbUser.id}::bigint
        ORDER BY c.club_name ASC
      `;
      
      console.log('[TRPC_CONTEXT] User clubs with status:', userClubsWithStatus);
      
      // Now filter for active clubs only
      const userClubs = await prisma.$queryRaw<Array<{
        id: bigint;
        club_name: string;
        club_description: string;
        status: string;
      }>>`
        SELECT c.id, c.club_name, c.club_description, c.status::text as status
        FROM club_leaders cl
        JOIN clubs c ON cl.club_id = c.id
        WHERE cl.user_id = ${dbUser.id}::bigint
          AND c.status = 'active'
        ORDER BY c.club_name ASC
      `;
      
      console.log('[TRPC_CONTEXT] Raw SQL result (active only):', userClubs);
      console.log('[TRPC_CONTEXT] Number of clubs found:', userClubs.length);
      
      clubs = userClubs.map(c => ({
        id: c.id,
        club_name: c.club_name,
        club_description: c.club_description,
        status: c.status as 'active' | 'terminated',
      }));
      clubIds = clubs.map(c => c.id);
      
      console.log('[TRPC_CONTEXT] Processed clubs:', clubs);
      console.log('[TRPC_CONTEXT] Club IDs:', clubIds);
    }

    return {
      user: {
        id: dbUser.id,
        auth_user_id: dbUser.auth_user_id!,
        role,
      },
      role,
      clubs,
      clubIds,
    };
  } catch (error) {
    console.error('[TRPC_CONTEXT] Error creating context:', error);
    return { user: null, role: null, clubs: [], clubIds: [] };
  }
});

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

// Protected procedures that require authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.role) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      user: ctx.user,
      role: ctx.role,
      clubs: ctx.clubs,
      clubIds: ctx.clubIds,
    },
  });
});

// Admin-only procedure
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    });
  }
  return next({ ctx });
});

// Super admin-only procedure
export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role !== 'super_admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only super admins can access this resource',
    });
  }
  return next({ ctx });
});
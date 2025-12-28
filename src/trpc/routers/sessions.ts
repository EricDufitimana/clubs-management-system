import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '../init';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';

export const sessionsRouter = createTRPCRouter({
  /**
   * Get all sessions for a specific club or user's clubs
   */
  getSessions: adminProcedure
    .input(
      z.object({
        clubId: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
    try {
      const { clubIds } = ctx;

      if (clubIds.length === 0) {
        return [];
      }

      // If clubId is provided, filter by that specific club
      const targetClubId = input?.clubId ? BigInt(input.clubId) : null;
      
      // Verify user has access to the requested club
      if (targetClubId && !clubIds.includes(targetClubId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view sessions for this club',
        });
      }

      const sessions = await prisma.session.findMany({
        where: {
          club_id: targetClubId ? targetClubId : { in: clubIds },
        },
        include: {
          club: {
            select: {
              club_name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      return sessions.map((session) => ({
        id: session.id.toString(),
        club_id: session.club_id.toString(),
        notes: session.notes,
        date: session.date.toISOString(),
        club_name: session.club.club_name,
      }));
    } catch (error: any) {
      console.error('[SESSIONS] Error fetching sessions:', error);
      
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch sessions',
      });
    }
  }),

  /**
   * Get sessions without attendance records for a specific club or user's clubs
   */
  getSessionsWithoutAttendance: adminProcedure
    .input(
      z.object({
        clubId: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
    try {
      const { clubIds } = ctx;

      if (clubIds.length === 0) {
        return [];
      }

      // If clubId is provided, filter by that specific club
      const targetClubId = input?.clubId ? BigInt(input.clubId) : null;
      
      // Verify user has access to the requested club
      if (targetClubId && !clubIds.includes(targetClubId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view sessions for this club',
        });
      }

      // Get sessions that don't have any attendance records
      const sessions = await prisma.session.findMany({
        where: {
          club_id: targetClubId ? targetClubId : { in: clubIds },
          attendance: {
            none: {},
          },
        },
        include: {
          club: {
            select: {
              club_name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      return sessions.map((session) => ({
        id: session.id.toString(),
        club_id: session.club_id.toString(),
        notes: session.notes,
        date: session.date.toISOString(),
        club_name: session.club.club_name,
      }));
    } catch (error: any) {
      console.error('[SESSIONS] Error fetching sessions without attendance:', error);
      
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch sessions',
      });
    }
  }),

  /**
   * Create a new session
   */
  createSession: adminProcedure
    .input(
      z.object({
        clubId: z.string(),
        notes: z.string().min(1, 'Notes are required'),
        date: z.string().datetime(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { clubId, notes, date } = input;
        const { clubIds } = ctx;

        // Verify user has access to this club
        const clubIdBigInt = BigInt(clubId);
        if (!clubIds.includes(clubIdBigInt)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to create sessions for this club',
          });
        }

        const session = await prisma.session.create({
          data: {
            club_id: clubIdBigInt,
            notes,
            date: new Date(date),
          },
        });

        return {
          id: session.id.toString(),
          club_id: session.club_id.toString(),
          notes: session.notes,
          date: session.date.toISOString(),
        };
      } catch (error: any) {
        console.error('[SESSIONS] Error creating session:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to create session',
        });
      }
    }),

  /**
   * Delete a session
   */
  deleteSession: adminProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { sessionId } = input;
        const { clubIds } = ctx;

        // Verify session belongs to user's club
        const session = await prisma.session.findUnique({
          where: { id: BigInt(sessionId) },
          select: { club_id: true },
        });

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session not found',
          });
        }

        if (!clubIds.includes(session.club_id)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this session',
          });
        }

        // Delete attendance records first (cascade)
        await prisma.attendance.deleteMany({
          where: { session_id: BigInt(sessionId) },
        });

        // Delete the session
        await prisma.session.delete({
          where: { id: BigInt(sessionId) },
        });

        return {
          success: true,
          message: 'Session deleted successfully',
        };
      } catch (error: any) {
        console.error('[SESSIONS] Error deleting session:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to delete session',
        });
      }
    }),
});


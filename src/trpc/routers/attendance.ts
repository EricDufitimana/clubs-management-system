import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '../init';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';
import { getAvatarUrl } from '@/utils/get-avatar';

export const attendanceRouter = createTRPCRouter({
  /**
   * Get all attendance records for a specific club or user's clubs
   */
  getAttendanceRecords: adminProcedure
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
          message: 'You do not have permission to view attendance for this club',
        });
      }

      // Fetch attendance records with joins to get student and session info
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          session: {
            club_id: targetClubId ? targetClubId : { in: clubIds },
          },
        },
        include: {
          student: true,
          session: {
            include: {
              club: {
                select: {
                  club_name: true,
                },
              },
            },
          },
        },
        orderBy: [
          { session: { date: 'desc' } },
          { student: { last_name: 'asc' } },
          { student: { first_name: 'asc' } },
        ],
      });

      return attendanceRecords.map((record) => {
        const avatarUrl = getAvatarUrl(
          record.student.gender || undefined,
          record.student.id
        );

        return {
          id: record.id.toString(),
          student_id: record.student.id.toString(),
          student_name: `${record.student.first_name} ${record.student.last_name}`,
          session_id: record.session.id.toString(),
          session_date: record.session.date.toISOString(),
          session_name:
            record.session.notes ||
            `Session on ${record.session.date.toISOString().split('T')[0]}`,
          status: record.attendance_status as 'present' | 'absent' | 'excused',
          club_name: record.session.club.club_name,
          avatarUrl,
        };
      });
    } catch (error: any) {
      console.error('[ATTENDANCE] Error fetching attendance records:', error);
      
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch attendance records',
      });
    }
  }),

  /**
   * Record attendance for a session
   */
  recordAttendance: adminProcedure
    .input(
      z.object({
        sessionId: z.string(),
        attendanceData: z.array(
          z.object({
            studentId: z.string(),
            status: z.enum(['present', 'absent', 'excused']),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { sessionId, attendanceData } = input;
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
            message: 'You do not have permission to record attendance for this session',
          });
        }

        // Delete existing attendance records for this session
        await prisma.attendance.deleteMany({
          where: { session_id: BigInt(sessionId) },
        });

        // Create new attendance records
        await prisma.attendance.createMany({
          data: attendanceData.map((record) => ({
            session_id: BigInt(sessionId),
            student_id: BigInt(record.studentId),
            attendance_status: record.status,
          })),
        });

        return {
          success: true,
          message: 'Attendance recorded successfully',
        };
      } catch (error: any) {
        console.error('[ATTENDANCE] Error recording attendance:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to record attendance',
        });
      }
    }),
});


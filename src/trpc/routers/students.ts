import { z } from 'zod';
import { createTRPCRouter, adminProcedure, superAdminProcedure } from '../init';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';
import { getAvatarUrl } from '@/utils/get-avatar';

export const studentsRouter = createTRPCRouter({
  /**
   * Get all students (not filtered by club membership)
   * Used for the "Add Members" dialog
   */
  getAllStudents: adminProcedure.query(async () => {
    try {
      const students = await prisma.student.findMany({
        orderBy: {
          first_name: 'asc',
        },
      });

      return students.map((student) => ({
        id: student.id.toString(),
        first_name: student.first_name,
        last_name: student.last_name,
        grade: student.grade ? String(student.grade) : undefined,
        combination: student.combination ? String(student.combination) : undefined,
        gender: student.gender || undefined,
      }));
    } catch (error: any) {
      console.error('[STUDENTS] Error fetching all students:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch students',
      });
    }
  }),

  /**
   * Remove a student from a club (mark as 'left')
   */
  removeStudent: adminProcedure
    .input(
      z.object({
        studentId: z.string(),
        clubId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { studentId, clubId } = input;
        const { user, clubIds } = ctx;

        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
          });
        }

        // Determine target club ID
        let targetClubId: bigint;

        if (clubId) {
          targetClubId = BigInt(clubId);
          // Verify user has access to this club
          if (!clubIds.includes(targetClubId)) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have permission to remove members from this club',
            });
          }
        } else {
          // If no clubId provided, use the first club the user leads
          if (clubIds.length === 0) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You are not a leader of any club',
            });
          }
          targetClubId = clubIds[0];
        }

        // Update membership status to 'left'
        await prisma.clubMember.updateMany({
          where: {
            student_id: BigInt(studentId),
            club_id: targetClubId,
          },
          data: {
            membership_status: 'left',
            left_at: new Date(),
          },
        });

        return {
          success: true,
          message: 'Member marked as left successfully',
        };
      } catch (error: any) {
        console.error('[STUDENTS] Error removing student:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to remove member',
        });
      }
    }),

  /**
   * Delete a member entirely from a club (hard delete)
   */
  deleteMember: adminProcedure
    .input(
      z.object({
        studentId: z.string(),
        clubId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { studentId, clubId } = input;
        const { user, clubIds } = ctx;

        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
          });
        }

        // Determine target club ID
        let targetClubId: bigint;

        if (clubId) {
          targetClubId = BigInt(clubId);
          // Verify user has access to this club
          if (!clubIds.includes(targetClubId)) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have permission to delete members from this club',
            });
          }
        } else {
          // If no clubId provided, use the first club the user leads
          if (clubIds.length === 0) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You are not a leader of any club',
            });
          }
          targetClubId = clubIds[0];
        }

        // Delete the membership record entirely
        await prisma.clubMember.deleteMany({
          where: {
            student_id: BigInt(studentId),
            club_id: targetClubId,
          },
        });

        return {
          success: true,
          message: 'Member deleted successfully',
        };
      } catch (error: any) {
        console.error('[STUDENTS] Error deleting member:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to delete member',
        });
      }
    }),

  /**
   * Get all active students (excluding Senior 6) who were NOT marked present this week.
   * When `category` is provided the search is scoped to sessions and memberships of that
   * club category only (subject_oriented_clubs | soft_skills_oriented_clubs).
   */
  getStudentsWithoutAttendanceThisWeek: superAdminProcedure
    .input(
      z.object({
        category: z.enum(['subject_oriented_clubs', 'soft_skills_oriented_clubs']).optional(),
        weekStart: z.string().optional(), // ISO string for the Monday of the target week
      }).optional()
    )
    .query(async ({ input }) => {
    try {
      const category = input?.category ?? null;

      // Resolve week boundaries
      let monday: Date;
      if (input?.weekStart) {
        monday = new Date(input.weekStart);
        monday.setHours(0, 0, 0, 0);
      } else {
        const now = new Date();
        const dayOfWeek = now.getDay();
        monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
      }
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // Sessions this week, optionally scoped to a club category
      const sessionsThisWeek = await prisma.session.findMany({
        where: {
          date: { gte: monday, lte: sunday },
          ...(category ? { club: { category } } : {}),
        },
        select: { id: true },
      });

      const sessionIds = sessionsThisWeek.map((s) => s.id);

      // Students who were present in those sessions
      const presentStudentIds = sessionIds.length > 0
        ? (await prisma.attendance.findMany({
            where: {
              session_id: { in: sessionIds },
              attendance_status: 'present',
            },
            select: { student_id: true },
            distinct: ['student_id'],
          })).map((a) => a.student_id)
        : [];

      // Active members, optionally scoped to a category
      const activeMembers = await prisma.clubMember.findMany({
        where: {
          membership_status: 'active',
          ...(category ? { club: { category } } : {}),
        },
        include: {
          student: true,
          club: { select: { id: true, club_name: true, category: true } },
        },
      });

      // Deduplicate by student, aggregate clubs
      const studentMap = new Map<string, {
        id: string;
        first_name: string;
        last_name: string;
        grade: string | null;
        combination: string | null;
        gender: string | null;
        avatarUrl: string;
        clubs: { name: string; category: string | null }[];
      }>();

      for (const member of activeMembers) {
        if (!member.student) continue;
        const s = member.student;
        if (s.grade === 'Senior6') continue;

        const key = s.id.toString();
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            id: key,
            first_name: s.first_name,
            last_name: s.last_name,
            grade: s.grade ?? null,
            combination: s.combination ?? null,
            gender: s.gender ?? null,
            avatarUrl: getAvatarUrl(s.gender ?? undefined, s.id),
            clubs: [],
          });
        }
        const entry = studentMap.get(key)!;
        if (member.club && !entry.clubs.find((c) => c.name === member.club!.club_name)) {
          entry.clubs.push({ name: member.club.club_name, category: member.club.category ?? null });
        }
      }

      const presentSet = new Set(presentStudentIds.map((id) => id.toString()));

      return Array.from(studentMap.values())
        .filter((s) => !presentSet.has(s.id))
        .sort((a, b) => a.last_name.localeCompare(b.last_name));
    } catch (error: any) {
      console.error('[STUDENTS] Error fetching students without attendance:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch students without attendance',
      });
    }
  }),

  /**
   * Delete multiple members from a club (bulk delete)
   */
  deleteMultipleMembers: adminProcedure
    .input(
      z.object({
        studentIds: z.array(z.string()),
        clubId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { studentIds, clubId } = input;
        const { user, clubIds } = ctx;

        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
          });
        }

        if (studentIds.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No student IDs provided',
          });
        }

        // Determine target club ID
        let targetClubId: bigint;

        if (clubId) {
          targetClubId = BigInt(clubId);
          // Verify user has access to this club
          if (!clubIds.includes(targetClubId)) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have permission to delete members from this club',
            });
          }
        } else {
          // If no clubId provided, use the first club the user leads
          if (clubIds.length === 0) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You are not a leader of any club',
            });
          }
          targetClubId = clubIds[0];
        }

        // Delete multiple membership records entirely
        const result = await prisma.clubMember.deleteMany({
          where: {
            student_id: { in: studentIds.map(id => BigInt(id)) },
            club_id: targetClubId,
          },
        });

        return {
          success: true,
          message: `${result.count} members deleted successfully`,
          deletedCount: result.count,
        };
      } catch (error: any) {
        console.error('[STUDENTS] Error deleting multiple members:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to delete members',
        });
      }
    }),
});


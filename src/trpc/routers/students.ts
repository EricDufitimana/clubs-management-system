import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '../init';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';

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


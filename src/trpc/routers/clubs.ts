import { z } from 'zod';
import { createTRPCRouter, adminProcedure, superAdminProcedure } from '../init';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';

export const clubsRouter = createTRPCRouter({
  /**
   * Get all clubs (admin sees their clubs, super_admin sees all active clubs)
   * This is already available in context.clubs, but provided as a query for consistency
   */
  getClubs: adminProcedure.query(async ({ ctx }) => {
    try {
      return ctx.clubs.map((club) => ({
        id: club.id.toString(),
        club_name: club.club_name,
        club_description: club.club_description,
        category: club.category,
        status: club.status,
      }));
    } catch (error: any) {
      console.error('[CLUBS] Error fetching clubs:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch clubs',
      });
    }
  }),

  /**
   * Get all clubs (for super admin) - includes both active and terminated
   */
  getAllClubs: superAdminProcedure.query(async () => {
    try {
      const clubs = await prisma.club.findMany({
        orderBy: {
          created_at: 'desc',
        },
      });

      return clubs.map((club) => ({
        id: club.id.toString(),
        club_name: club.club_name,
        club_description: club.club_description,
        category: club.category,
        status: club.status,
        created_at: club.created_at.toISOString(),
      }));
    } catch (error: any) {
      console.error('[CLUBS] Error fetching all clubs:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch clubs',
      });
    }
  }),

  /**
   * Get current user's club (for admin)
   */
  getCurrentUserClub: adminProcedure.query(async ({ ctx }) => {
    try {
      const { user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        });
      }

      // Get the club this user is a leader of
      const clubLeader = await prisma.clubLeader.findFirst({
        where: {
          user_id: user.id,
        },
        include: {
          club: true,
        },
      });

      if (!clubLeader) {
        return {
          club_name: null,
          club_id: null,
        };
      }

      return {
        club_name: clubLeader.club.club_name,
        club_id: clubLeader.club.id.toString(),
      };
    } catch (error: any) {
      console.error('[CLUBS] Error fetching current user club:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch user club',
      });
    }
  }),

  /**
   * Create a new club
   */
  createClub: superAdminProcedure
    .input(
      z.object({
        club_name: z.string().min(1, 'Club name is required'),
        club_description: z.string().min(1, 'Club description is required'),
        category: z.enum(['subject_oriented_clubs', 'soft_skills_oriented_clubs']).default('subject_oriented_clubs'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { club_name, club_description, category } = input;

        const club = await prisma.club.create({
          data: {
            club_name,
            club_description,
            category: category as any,
            status: 'active',
            created_by: ctx.user.auth_user_id,
          },
        });

        return {
          id: club.id.toString(),
          club_name: club.club_name,
          club_description: club.club_description,
          category: club.category,
          status: club.status,
        };
      } catch (error: any) {
        console.error('[CLUBS] Error creating club:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to create club',
        });
      }
    }),

  /**
   * Update a club
   */
  updateClub: superAdminProcedure
    .input(
      z.object({
        clubId: z.string(),
        club_name: z.string().min(1, 'Club name is required'),
        club_description: z.string().min(1, 'Club description is required'),
        category: z.enum(['subject_oriented_clubs', 'soft_skills_oriented_clubs']).default('subject_oriented_clubs'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { clubId, club_name, club_description, category } = input;

        const club = await prisma.club.update({
          where: { id: BigInt(clubId) },
          data: {
            club_name,
            club_description,
            category: category as any,
          },
        });

        return {
          id: club.id.toString(),
          club_name: club.club_name,
          club_description: club.club_description,
          category: club.category,
          status: club.status,
        };
      } catch (error: any) {
        console.error('[CLUBS] Error updating club:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to update club',
        });
      }
    }),

  /**
   * Deactivate/Terminate a club
   */
  deactivateClub: superAdminProcedure
    .input(z.object({ clubId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { clubId } = input;

        const club = await prisma.club.update({
          where: { id: BigInt(clubId) },
          data: {
            status: 'terminated',
          },
        });

        return {
          success: true,
          message: 'Club deactivated successfully',
        };
      } catch (error: any) {
        console.error('[CLUBS] Error deactivating club:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to deactivate club',
        });
      }
    }),

  /**
   * Reactivate a club
   */
  reactivateClub: superAdminProcedure
    .input(z.object({ clubId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { clubId } = input;

        const club = await prisma.club.update({
          where: { id: BigInt(clubId) },
          data: {
            status: 'active',
          },
        });

        return {
          success: true,
          message: 'Club reactivated successfully',
        };
      } catch (error: any) {
        console.error('[CLUBS] Error reactivating club:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to reactivate club',
        });
      }
    }),

  /**
   * Check which students are already members of a club
   */
  checkClubMembers: adminProcedure
    .input(z.object({ clubId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { clubId } = input;

        const members = await prisma.clubMember.findMany({
          where: {
            club_id: BigInt(clubId),
            membership_status: 'active',
          },
          select: {
            student_id: true,
          },
        });

        return {
          memberIds: members.map((m) => m.student_id?.toString()).filter(Boolean) as string[],
        };
      } catch (error: any) {
        console.error('[CLUBS] Error checking club members:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to check club members',
        });
      }
    }),

  /**
   * Get club invitations
   */
  getClubInvites: adminProcedure
    .input(z.object({ clubId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const { clubId } = input;
        const clubIdBigInt = BigInt(clubId);

        // Verify user has access to this club
        if (!ctx.clubIds.includes(clubIdBigInt)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to view invitations for this club',
          });
        }

        const invites = await prisma.clubInvite.findMany({
          where: { club_id: clubIdBigInt },
          orderBy: { created_at: 'desc' },
        });

        return invites.map(invite => ({
          id: invite.id.toString(),
          email: invite.email,
          role: invite.role || 'Position', // role now contains the position title
          createdAt: invite.created_at.toISOString(),
          expiresAt: invite.expires_at.toISOString(),
          usedAt: invite.used_at?.toISOString() || null,
          isExpired: invite.expires_at < new Date(),
          isUsed: !!invite.used_at,
        }));
      } catch (error: any) {
        console.error('[CLUBS] Error fetching club invites:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to fetch club invites',
        });
      }
    }),

  /**
   * Add members to a club
   */
  addMembers: adminProcedure
    .input(
      z.object({
        studentIds: z.array(z.string()).min(1, 'Please select at least one student'),
        clubId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { studentIds, clubId } = input;
        const { clubIds, user } = ctx;

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
              message: 'You do not have permission to add members to this club',
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

        // Check which students are already members
        const existingMembers = await prisma.clubMember.findMany({
          where: {
            club_id: targetClubId,
            student_id: { in: studentIds.map((id) => BigInt(id)) },
            membership_status: 'active',
          },
          select: {
            student_id: true,
          },
        });

        const existingStudentIds = new Set(
          existingMembers.map((m) => m.student_id?.toString()).filter(Boolean) as string[]
        );
        const newStudentIds = studentIds.filter((id) => !existingStudentIds.has(id));

        if (newStudentIds.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'All selected students are already members of this club',
          });
        }

        // Get target club details to check category
        const targetClub = await prisma.club.findUnique({
          where: { id: targetClubId },
          select: { category: true }
        });

        if (!targetClub) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Target club not found',
          });
        }

        // Check club membership restrictions for each new student
        const studentClubRestrictions = await prisma.$queryRaw<Array<{
          student_id: bigint;
          existing_clubs_count: number;
          subject_oriented_count: number;
          soft_skills_oriented_count: number;
        }>>`
          SELECT 
            cm.student_id,
            COUNT(cm.club_id) as existing_clubs_count,
            COUNT(CASE WHEN c.category = 'subject_oriented_clubs' THEN 1 END) as subject_oriented_count,
            COUNT(CASE WHEN c.category = 'soft_skills_oriented_clubs' THEN 1 END) as soft_skills_oriented_count
          FROM club-members cm
          JOIN clubs c ON cm.club_id = c.id
          WHERE cm.student_id IN (${newStudentIds.map(id => BigInt(id)).join(',')})
            AND cm.membership_status = 'active'
          GROUP BY cm.student_id
        `;

        const restrictedStudents: string[] = [];
        
        for (const student of newStudentIds) {
          const restriction = studentClubRestrictions.find(r => r.student_id.toString() === student);
          
          if (restriction) {
            const targetCategory = targetClub.category;
            
            // If student already has 2 clubs, restrict
            if (restriction.existing_clubs_count >= 2) {
              restrictedStudents.push(student);
              continue;
            }
            
            // If target club is subject oriented and student already has one, restrict
            if (targetCategory === 'subject_oriented_clubs' && restriction.subject_oriented_count >= 1) {
              restrictedStudents.push(student);
              continue;
            }
            
            // If target club is soft skills oriented and student already has one, restrict
            if (targetCategory === 'soft_skills_oriented_clubs' && restriction.soft_skills_oriented_count >= 1) {
              restrictedStudents.push(student);
              continue;
            }
          }
        }

        if (restrictedStudents.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot add ${restrictedStudents.length} student(s) due to club membership restrictions. Students can only join maximum 2 clubs (1 subject-oriented + 1 soft skills-oriented).`,
          });
        }

        // Add new members
        await prisma.clubMember.createMany({
          data: newStudentIds.map((studentId) => ({
            club_id: targetClubId,
            student_id: BigInt(studentId),
            membership_status: 'active',
            joined_at: new Date(),
          })),
        });

        return {
          success: true,
          added: newStudentIds,
          alreadyMembers: Array.from(existingStudentIds),
          message: `Successfully added ${newStudentIds.length} student(s) to the club${
            existingStudentIds.size > 0
              ? `. ${existingStudentIds.size} student(s) were already members.`
              : ''
          }`,
        };
      } catch (error: any) {
        console.error('[CLUBS] Error adding members:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to add club members',
        });
      }
    }),

  /**
   * Get students who are in multiple clubs
   */
  getStudentsInMultipleClubs: superAdminProcedure.query(async () => {
    try {
      const studentsInMultipleClubs = await prisma.$queryRaw<Array<{
        student_id: bigint;
        student_name: string;
        grade: string;
        combination: string;
        gender: string;
        club_count: number;
        clubs: Array<{
          club_id: bigint;
          club_name: string;
          club_category: string;
          membership_status: string;
          joined_at: Date;
        }>;
      }>>`
        SELECT 
          s.id as student_id,
          s.first_name || ' ' || s.last_name as student_name,
          s.grade::text as grade,
          s.combination::text as combination,
          s.gender::text as gender,
          COUNT(cm.club_id) as club_count,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'club_id', c.id,
              'club_name', c.club_name,
              'club_category', c.category::text,
              'membership_status', cm.membership_status::text,
              'joined_at', cm.joined_at
            ) ORDER BY cm.joined_at DESC
          ) as clubs
        FROM students s
        JOIN club-members cm ON s.id = cm.student_id
        JOIN clubs c ON cm.club_id = c.id
        WHERE cm.membership_status = 'active'
        GROUP BY s.id, s.first_name, s.last_name, s.grade, s.combination, s.gender
        HAVING COUNT(cm.club_id) > 1
        ORDER BY student_name ASC
      `;

      return studentsInMultipleClubs.map(student => ({
        studentId: student.student_id.toString(),
        studentName: student.student_name,
        grade: student.grade,
        combination: student.combination,
        gender: student.gender,
        clubCount: student.club_count,
        clubs: student.clubs.map(club => ({
          clubId: club.club_id.toString(),
          clubName: club.club_name,
          clubCategory: club.club_category,
          membershipStatus: club.membership_status,
          joinedAt: club.joined_at.toISOString(),
        })),
      }));
    } catch (error: any) {
      console.error('[CLUBS] Error fetching students in multiple clubs:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch students in multiple clubs',
      });
    }
  }),
});


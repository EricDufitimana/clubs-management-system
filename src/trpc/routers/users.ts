import { z } from "zod";
import { createTRPCRouter, adminProcedure, superAdminProcedure } from "../init";
import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/utils/get-avatar";
import { TRPCError } from "@trpc/server";

export const usersRouter = createTRPCRouter({
    getUsersByClub: adminProcedure
        .input(
            z.object({
                clubId: z.string().optional(),
            }).optional()
        )
        .query(async({input, ctx}) => {
        const {clubIds} = ctx;
        if (clubIds.length === 0) {
            return [];
        }

        // If clubId is provided, filter by that specific club
        const targetClubId = input?.clubId ? BigInt(input.clubId) : null;
        
        // Verify user has access to the requested club
        if (targetClubId && !clubIds.includes(targetClubId)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You do not have permission to view members for this club',
            });
        }

        // Get all club members for the user's clubs
        const clubMembers = await prisma.clubMember.findMany({
            where: {
                club_id: targetClubId ? targetClubId : { in: clubIds }
            },
            include: {
                student: true,
                club: {
                    select: {
                        club_name: true,
                    }
                }
            }
        });

        // Map of student IDs to club names and status
        const studentMap = new Map<string, {
            student: NonNullable<typeof clubMembers[0]['student']>;
            clubName: string;
            status: 'active' | 'left';
        }>();

        clubMembers.forEach(member => {
            if (!member.student) return;
            
            const studentIdStr = member.student.id.toString();
            const clubName = member.club?.club_name || '';
            
            // Map student to club name (if multiple clubs, keep the first one found)
            if (!studentMap.has(studentIdStr)) {
                studentMap.set(studentIdStr, {
                    student: member.student,
                    clubName,
                    status: member.membership_status,
                });
            } else {
                // Update if current membership is active (prefer active status)
                const existing = studentMap.get(studentIdStr)!;
                if (member.membership_status === 'active') {
                    existing.status = 'active';
                }
            }
        });

        // Map to UserProps structure (only active members)
        return Array.from(studentMap.values())
            .filter(({ status }) => status === 'active')
            .map(({ student, clubName }) => {
            const avatarUrl = getAvatarUrl(student.gender || undefined, student.id);
            
            return {
                id: student.id.toString(),
                name: `${student.first_name} ${student.last_name}`,
                role: student.grade ? String(student.grade) : undefined,
                status: 'active' as const,
                company: student.combination ? String(student.combination) : undefined,
                avatarUrl,
                isVerified: false,
                club_name: clubName || null,
            };
        });
    }),
    
    getAllUsers: adminProcedure.query(async({ctx}) => {
        // Get all club members (for super admin)
        const allMembers = await prisma.clubMember.findMany({
            include: {
                student: true,
                club: {
                    select: {
                        id: true,
                        club_name: true,
                        category: true,
                    }
                }
            }
        });

        // Map students to their clubs (both subject-oriented and soft-oriented)
        const studentMap = new Map<string, {
            student: NonNullable<typeof allMembers[0]['student']>;
            subjectOrientedClub?: string;
            softOrientedClub?: string;
            clubName: string;
            status: 'active' | 'left';
        }>();
        
        allMembers.forEach(member => {
            if (!member.student) return;
            
            const studentIdStr = member.student.id.toString();
            const clubName = member.club?.club_name || '';
            const clubCategory = member.club?.category;
            
            // Initialize student entry if not exists
            if (!studentMap.has(studentIdStr)) {
                studentMap.set(studentIdStr, {
                    student: member.student,
                    subjectOrientedClub: undefined,
                    softOrientedClub: undefined,
                    clubName,
                    status: member.membership_status,
                });
            }
            
            const studentEntry = studentMap.get(studentIdStr)!;
            
            // Update club based on category
            if (clubCategory === 'subject_oriented_clubs') {
                studentEntry.subjectOrientedClub = clubName;
            } else if (clubCategory === 'soft_skills_oriented_clubs') {
                studentEntry.softOrientedClub = clubName;
            }
            
            // Update status (prefer active status)
            if (member.membership_status === 'active') {
                studentEntry.status = 'active';
            }
        });

        // Map to UserProps structure (only active members)
        return Array.from(studentMap.values())
            .filter(({ status }) => status === 'active')
            .map(({ student, subjectOrientedClub, softOrientedClub, clubName }) => {
            const avatarUrl = getAvatarUrl(student.gender || undefined, student.id);
            
            return {
                id: student.id.toString(),
                name: `${student.first_name} ${student.last_name}`,
                role: student.grade ? String(student.grade) : undefined,
                status: 'active' as const,
                company: student.combination ? String(student.combination) : undefined,
                avatarUrl,
                isVerified: false,
                club_name: clubName || null,
                subject_oriented_club: subjectOrientedClub || null,
                soft_oriented_club: softOrientedClub || null,
            };
        });
    }),

    getLeftMembers: adminProcedure
        .input(
            z.object({
                clubId: z.string().optional(),
            }).optional()
        )
        .query(async({input, ctx}) => {
        const {clubIds} = ctx;
        if (clubIds.length === 0) {
            return [];
        }

        // If clubId is provided, filter by that specific club
        const targetClubId = input?.clubId ? BigInt(input.clubId) : null;
        
        // Verify user has access to the requested club
        if (targetClubId && !clubIds.includes(targetClubId)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You do not have permission to view left members for this club',
            });
        }

        // Get left members with their join and leave dates
        const leftMembers = await prisma.clubMember.findMany({
            where: {
                club_id: targetClubId ? targetClubId : { in: clubIds },
                membership_status: 'left',
            },
            include: {
                student: true,
                club: {
                    select: {
                        club_name: true,
                    }
                }
            },
            orderBy: {
                left_at: 'desc',
            },
        });

        return leftMembers
            .filter(member => member.student !== null)
            .map((member) => {
                const student = member.student!;
                const avatarUrl = getAvatarUrl(student.gender || undefined, student.id);
                
                return {
                    id: student.id.toString(),
                    first_name: student.first_name,
                    last_name: student.last_name,
                    name: `${student.first_name} ${student.last_name}`,
                    grade: student.grade,
                    combination: student.combination,
                    gender: student.gender,
                    avatarUrl,
                    joined_at: member.joined_at.toISOString(),
                    left_at: member.left_at?.toISOString() || '',
                    clubName: member.club?.club_name || 'Unknown Club',
                };
            });
    }),

    markMembersAsLeft: adminProcedure
        .input(z.object({
            memberIds: z.array(z.string()),
        }))
        .mutation(async ({ ctx, input }) => {
            const { clubIds } = ctx;
            const { memberIds } = input;

            if (clubIds.length === 0) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'No club access',
                });
            }

            try {
                // Update club members to mark as left
                const result = await prisma.clubMember.updateMany({
                    where: {
                        student_id: { in: memberIds.map(id => BigInt(id)) },
                        club_id: { in: clubIds },
                        membership_status: 'active',
                    },
                    data: {
                        membership_status: 'left',
                        left_at: new Date(),
                    },
                });

                return {
                    success: true,
                    count: result.count,
                };
            } catch (error) {
                console.error('[MARK_AS_LEFT] Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to mark members as left',
                });
            }
        }),

    markMemberAsLeftFromClub: superAdminProcedure
        .input(z.object({
            memberId: z.string(),
            clubId: z.string(),
        }))
        .mutation(async ({ input }) => {
            const { memberId, clubId } = input;

            try {
                // Update the specific club member to mark as left
                const result = await prisma.clubMember.updateMany({
                    where: {
                        student_id: BigInt(memberId),
                        club_id: BigInt(clubId),
                        membership_status: 'active',
                    },
                    data: {
                        membership_status: 'left',
                        left_at: new Date(),
                    },
                });

                if (result.count === 0) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Member not found in this club',
                    });
                }

                return {
                    success: true,
                    message: 'Member marked as left from the club',
                };
            } catch (error) {
                console.error('[MARK_MEMBER_AS_LEFT_FROM_CLUB] Error:', error);
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to mark member as left from club',
                });
            }
        }),
})
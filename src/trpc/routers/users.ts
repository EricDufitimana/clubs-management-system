import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../init";
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

        // Map to UserProps structure
        return Array.from(studentMap.values()).map(({ student, clubName, status }) => {
            const avatarUrl = getAvatarUrl(student.gender || undefined, student.id);
            
            return {
                id: student.id.toString(),
                name: `${student.first_name} ${student.last_name}`,
                role: student.grade ? String(student.grade) : undefined,
                status,
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
                    }
                }
            }
        });

        // Map students to clubs
        const studentMap = new Map<string, {
            student: NonNullable<typeof allMembers[0]['student']>;
            clubName: string;
            status: 'active' | 'left';
        }>();
        
        allMembers.forEach(member => {
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

        // Map to UserProps structure
        return Array.from(studentMap.values()).map(({ student, clubName, status }) => {
            const avatarUrl = getAvatarUrl(student.gender || undefined, student.id);
            
            return {
                id: student.id.toString(),
                name: `${student.first_name} ${student.last_name}`,
                role: student.grade ? String(student.grade) : undefined,
                status,
                company: student.combination ? String(student.combination) : undefined,
                avatarUrl,
                isVerified: false,
                club_name: clubName || null,
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
})
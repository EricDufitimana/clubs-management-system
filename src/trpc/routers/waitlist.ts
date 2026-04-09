import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { baseProcedure, createTRPCRouter } from '../init';
import { prisma } from '@/lib/prisma';

const waitlistSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['student', 'school-administrator', 'teacher']),
  schoolOrganization: z.string().min(1, 'School/Organization is required'),
  country: z.string().min(1, 'Country is required'),
  currentMethod: z.enum(['whatsapp', 'excel', 'paper', 'other']),
  otherMethod: z.string().optional(),
  willingToPay: z.enum(['yes', 'maybe', 'no']),
});

export const waitlistRouter = createTRPCRouter({
  submit: baseProcedure
    .input(waitlistSchema)
    .mutation(async ({ input }) => {
      const {
        fullName,
        email,
        role,
        schoolOrganization,
        country,
        currentMethod,
        otherMethod,
        willingToPay
      } = input;

      // Validate that other_method is provided when current_method is 'other'
      if (currentMethod === 'other' && (!otherMethod || otherMethod.trim() === '')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'other_method is required when current_method is "other"',
        });
      }

      // Map the role value to the enum format
      const roleMap: Record<string, 'student' | 'school_administrator'> = {
        'student': 'student',
        'school-administrator': 'school_administrator',
        'teacher': 'student' // Map teacher to student as it's not in the enum
      };

      const mappedRole = roleMap[role] || 'student';

      try {
        // Create waitlist entry
        const waitlistEntry = await prisma.waitlist.create({
          data: {
            full_name: fullName,
            email: email.toLowerCase(),
            role: mappedRole,
            school_organization: schoolOrganization,
            country: country,
            current_method: currentMethod,
            other_method: currentMethod === 'other' ? otherMethod : null,
            willing_to_pay: willingToPay
          }
        });

        return {
          success: true,
          message: 'Successfully added to waitlist',
          data: waitlistEntry
        };
      } catch (error: any) {
        console.error('Waitlist submission error:', error);
        
        // Handle unique constraint violation (email already exists)
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This email is already on the waitlist',
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit to waitlist. Please try again later.',
        });
      }
    }),
});

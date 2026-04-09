import { z } from "zod";
import { createTRPCRouter, superAdminProcedure, baseProcedure } from "../init";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendSuperAdminInvite } from "@/lib/email";

export const superAdminInvitesRouter = createTRPCRouter({
  createInvite: superAdminProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      console.log("Email:", email)
      const supabase = await createClient();
      const { data: authUser, error } = await supabase.auth.admin.listUsers();
      console.log("Auth user: ", authUser)
      const user = authUser.users.find(u => u.email === email);
      console.log("User:", user)

      let existingUser = null;
      if (user) {
        existingUser = await prisma.user.findFirst({
          where: {
            auth_user_id: user.id,
          },
        });
      }

      

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A user with this email already exists in the system",
        });
      }

      // Check if there's already a pending invite for this email
      const existingInvite = await prisma.superAdminInvite.findFirst({
        where: {
          email,
          used_at: null,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      if (existingInvite) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An invitation for this email already exists and is still valid",
        });
      }

      // Generate token and create invite
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const invite = await prisma.superAdminInvite.create({
        data: {
          email,
          token,
          expires_at: expiresAt,
        },
      });

      // Send invitation email
      const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join-super-admin/${token}`;
      const emailResult = await sendSuperAdminInvite({
        to: email,
        inviteLink,
        expiresAt
      });

      if (emailResult.error) {
        console.error('[SUPER_ADMIN_INVITE] Failed to send email:', emailResult.error);
        // Note: We don't fail the invite creation if email fails, but we log it
      }

      return {
        id: invite.id.toString(),
        email: invite.email,
        token: invite.token,
        expires_at: invite.expires_at,
        emailSent: !emailResult.error,
      };
    }),

  acceptInvite: baseProcedure
    .input(
      z.object({
        token: z.string(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        authUserId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { token, firstName, lastName, authUserId } = input;

      // Find valid invite
      const invite = await prisma.superAdminInvite.findFirst({
        where: {
          token,
          used_at: null,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired invitation token",
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          auth_user_id: authUserId,
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already exists in the system",
        });
      }

      // Create super admin user
      const user = await prisma.user.create({
        data: {
          auth_user_id: authUserId,
          first_name: firstName,
          last_name: lastName,
          role: "super_admin",
        },
      });

      // Mark invite as used
      await prisma.superAdminInvite.update({
        where: {
          id: invite.id,
        },
        data: {
          used_at: new Date(),
        },
      });

      return {
        success: true,
        userId: user.id.toString(),
        message: "Successfully joined as super admin",
      };
    }),

  acceptInviteWithAuth: baseProcedure
    .input(
      z.object({
        token: z.string(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { token, firstName, lastName, email, password } = input;
      const supabaseAdmin = await createAdminClient();

      // Find valid invite
      const invite = await prisma.superAdminInvite.findFirst({
        where: {
          token,
          used_at: null,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired invitation token",
        });
      }

      // First, create user in Supabase Auth using admin client (no auth required)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (authError || !authData.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user account: " + (authError?.message || 'Unknown error'),
        });
      }

      // Now create user in database using the auth user ID
      const user = await prisma.user.create({
        data: {
          auth_user_id: authData.user.id, // Use the created auth user ID
          first_name: firstName,
          last_name: lastName,
          role: "super_admin",
        },
      });

      // Mark invite as used
      await prisma.superAdminInvite.update({
        where: {
          id: invite.id,
        },
        data: {
          used_at: new Date(),
        },
      });

      return {
        success: true,
        userId: user.id.toString(),
        authUserId: authData.user.id,
        message: "Successfully created super admin account",
      };
    }),

  validateInvite: baseProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { token } = input;

      const invite = await prisma.superAdminInvite.findFirst({
        where: {
          token,
          used_at: null,
          expires_at: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          email: true,
          expires_at: true,
          created_at: true,
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired invitation token",
        });
      }

      return {
        id: invite.id.toString(),
        email: invite.email,
        expires_at: invite.expires_at,
        created_at: invite.created_at,
      };
    }),

  getInvites: superAdminProcedure
    .query(async ({}) => {
      const invites = await prisma.superAdminInvite.findMany({
        orderBy: {
          created_at: "desc",
        },
        select: {
          id: true,
          email: true,
          token: true,
          expires_at: true,
          created_at: true,
          used_at: true,
        },
      });

      return invites.map((invite: any) => ({
        id: invite.id.toString(),
        email: invite.email,
        token: invite.token,
        expires_at: invite.expires_at,
        created_at: invite.created_at,
        used_at: invite.used_at,
        status: invite.used_at ? "used" : 
                invite.expires_at < new Date() ? "expired" : "pending",
      }));
    }),
});

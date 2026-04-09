import { inngest } from "@/inngest/client";
import { createTRPCRouter, adminProcedure, baseProcedure } from "../init";
import {z} from "zod";

export const inngestRouter = createTRPCRouter({
    invoke: baseProcedure 
        .input(z.object({
            text: z.string()
        }))
        .mutation(async({input}) => {
            // Use invoke to wait for the function to complete and get its result
            const result = await inngest.send({
                name: "test/hello.world",
                data: {
                    email: input.text,
                }
            });
            return result;
        })
});
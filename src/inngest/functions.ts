import { inngest } from "./client";
import {createAgent, openai} from "@inngest/agent-kit";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {

    const supportAgent = createAgent({
      model: openai({ model: "gpt-3.5-turbo" }),
      name: "Summarizer",
      system: "You are an summarizer agent that summarizes text into a 2 words",
    });

    const result = await supportAgent.run(`Summarize the following text: ${event.data.email}`)
    return {result };
  },
);
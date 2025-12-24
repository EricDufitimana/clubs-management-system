'use client';
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
const testing = () => {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.something.queryOptions({ text: "Eric" }));
  return (
    <div>
      <h1>{JSON.stringify(data)}</h1>
    </div>
  )
 }

 export default testing;
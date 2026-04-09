'use client';
import Button from '@mui/material/Button';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import Input from '@mui/material/Input';
import { useState } from 'react';

export default function Page() {
    const [value, setValue] = useState('');
    const trpc = useTRPC();
    const invoke = useMutation(trpc.inngest.invoke.mutationOptions());
    return(
        <div>
            <Input value={value} onChange={(e) => setValue(e.target.value)} />
            <Button onClick={() => invoke.mutate({text: value})}>
                Invoke
            </Button>
            {invoke.isPending && <p>Invoking...</p>}

        </div>
    )
}
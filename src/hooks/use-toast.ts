import { create } from "zustand";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number; // ms. undefined = infinite (for loading)
  action?: ToastAction;
}

interface ToastStore {
  toasts: Toast[];
  position: ToastPosition;
  setPosition: (p: ToastPosition) => void;
  add: (toast: Omit<Toast, "id">) => string;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Omit<Toast, "id">>) => void;
  dismiss: (id: string) => void; // alias for remove (for loading → resolve flow)
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  position: "top-right" as ToastPosition,

  setPosition: (position) => set({ position }),

  add: (toast) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [{ id, ...toast }, ...s.toasts] }));
    return id;
  },

  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  update: (id, patch) =>
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  dismiss: (id) => get().remove(id),
}));

// ─── Public API ───────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 4000;

function toast(opts: Omit<Toast, "id">) {
  return useToastStore.getState().add(opts);
}

toast.success = (title: string, opts?: Partial<Omit<Toast, "id" | "variant">>) =>
  toast({ variant: "success", title, duration: DEFAULT_DURATION, ...opts });

toast.error = (title: string, opts?: Partial<Omit<Toast, "id" | "variant">>) =>
  toast({ variant: "error", title, duration: DEFAULT_DURATION, ...opts });

toast.warning = (title: string, opts?: Partial<Omit<Toast, "id" | "variant">>) =>
  toast({ variant: "warning", title, duration: DEFAULT_DURATION, ...opts });

toast.info = (title: string, opts?: Partial<Omit<Toast, "id" | "variant">>) =>
  toast({ variant: "info", title, duration: DEFAULT_DURATION, ...opts });

/**
 * Returns helpers to resolve or reject a loading toast.
 * Usage:
 *   const { resolve, reject } = toast.promise(myAsyncFn());
 */
toast.loading = (title: string, opts?: Partial<Omit<Toast, "id" | "variant">>) => {
  const id = toast({ variant: "loading", title, duration: undefined, ...opts });

  return {
    id,
    resolve: (successTitle: string, successOpts?: Partial<Omit<Toast, "id" | "variant">>) => {
      useToastStore.getState().update(id, {
        variant: "success",
        title: successTitle,
        duration: DEFAULT_DURATION,
        ...successOpts,
      });
      setTimeout(() => useToastStore.getState().remove(id), DEFAULT_DURATION);
    },
    reject: (errTitle: string, errOpts?: Partial<Omit<Toast, "id" | "variant">>) => {
      useToastStore.getState().update(id, {
        variant: "error",
        title: errTitle,
        duration: DEFAULT_DURATION,
        ...errOpts,
      });
      setTimeout(() => useToastStore.getState().remove(id), DEFAULT_DURATION);
    },
  };
};

export { toast };

// Simple hook to consume inside components
export function useToast() {
  const { position, setPosition } = useToastStore();
  return { toast, position, setPosition };
}

import { writable } from "svelte/store";

export type Toast = {
  id: string;
  kind: "success" | "error";
  message: string;
};

const createToastStore = () => {
  const { subscribe, update } = writable<Toast[]>([]);

  const push = (kind: Toast["kind"], message: string) => {
    const id = crypto.randomUUID();
    update((items) => [...items, { id, kind, message }]);

    setTimeout(() => {
      update((items) => items.filter((item) => item.id !== id));
    }, 3500);
  };

  return {
    subscribe,
    success: (message: string) => push("success", message),
    error: (message: string) => push("error", message)
  };
};

export const toasts = createToastStore();

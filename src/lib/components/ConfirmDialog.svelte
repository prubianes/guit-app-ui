<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/Button.svelte";

  const dispatch = createEventDispatcher<{ cancel: void; confirm: void }>();

  let {
    open = false,
    title = "Confirm",
    description = "Are you sure?",
    confirmLabel = "Delete"
  }: {
    open: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
  } = $props();
</script>

{#if open}
  <div class="fixed inset-0 z-40 bg-black/40" role="presentation" onclick={() => dispatch("cancel")}></div>
  <section
    class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
    role="dialog"
    aria-modal="true"
  >
    <h3 class="text-lg font-semibold text-slate-900">{title}</h3>
    <p class="mt-2 text-sm text-slate-600">{description}</p>
    <div class="mt-5 flex justify-end gap-2">
      <Button variant="ghost" on:click={() => dispatch("cancel")}>Cancel</Button>
      <Button variant="danger" on:click={() => dispatch("confirm")}>{confirmLabel}</Button>
    </div>
  </section>
{/if}

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher<{ close: void }>();

  let {
    open = false,
    title = "",
    children
  }: {
    open: boolean;
    title: string;
    children?: import("svelte").Snippet;
  } = $props();
</script>

{#if open}
  <div class="fixed inset-0 z-40 bg-black/40" role="presentation" onclick={() => dispatch("close")}></div>
  <section
    class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
    role="dialog"
    aria-modal="true"
  >
    <header class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-900">{title}</h3>
      <button
        type="button"
        class="rounded p-2 text-slate-500 hover:bg-slate-100"
        onclick={() => dispatch("close")}
        aria-label="Close"
      >
        ✕
      </button>
    </header>
    {@render children?.()}
  </section>
{/if}

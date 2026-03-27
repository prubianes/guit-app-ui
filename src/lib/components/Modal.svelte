<script lang="ts">
  import { tick } from "svelte";
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

  let modalRoot: HTMLElement | null = $state(null);
  const titleId = $derived(`modal-title-${title.toLowerCase().replace(/\s+/g, "-") || "dialog"}`);

  $effect(() => {
    if (!open) return;
    tick().then(() => {
      modalRoot?.focus();
    });
  });

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dispatch("close");
    }
  };
</script>

{#if open}
  <div class="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]" role="presentation" onclick={() => dispatch("close")}></div>
  <div
    bind:this={modalRoot}
    tabindex="-1"
    class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 orbit-frame p-5 sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    onkeydown={onKeydown}
  >
    <header class="mb-4 flex items-center justify-between">
      <h3 id={titleId} class="text-xl font-semibold text-slate-900">{title}</h3>
      <button
        type="button"
        class="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
        onclick={() => dispatch("close")}
        aria-label="Close"
      >
        ✕
      </button>
    </header>
    {@render children?.()}
  </div>
{/if}

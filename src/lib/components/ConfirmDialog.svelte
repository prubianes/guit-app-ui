<script lang="ts">
  import { tick } from "svelte";
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

  let dialogRoot: HTMLElement | null = $state(null);
  const titleId = $derived(`confirm-title-${title.toLowerCase().replace(/\s+/g, "-") || "dialog"}`);
  const descriptionId = $derived(`${titleId}-desc`);

  $effect(() => {
    if (!open) return;
    tick().then(() => {
      dialogRoot?.focus();
    });
  });

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dispatch("cancel");
    }
  };
</script>

{#if open}
  <div class="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]" role="presentation" onclick={() => dispatch("cancel")}></div>
  <div
    bind:this={dialogRoot}
    tabindex="-1"
    class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 orbit-frame p-5 sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    aria-describedby={descriptionId}
    onkeydown={onKeydown}
  >
    <h3 id={titleId} class="text-xl font-semibold text-slate-900">{title}</h3>
    <p id={descriptionId} class="mt-2 text-sm text-slate-600">{description}</p>
    <div class="mt-5 flex justify-end gap-2">
      <Button variant="ghost" on:click={() => dispatch("cancel")}>Cancel</Button>
      <Button variant="danger" on:click={() => dispatch("confirm")}>{confirmLabel}</Button>
    </div>
  </div>
{/if}

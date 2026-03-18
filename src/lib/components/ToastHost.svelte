<script lang="ts">
  import { toasts } from "$lib/components/toastStore";
</script>

<div class="pointer-events-none fixed right-4 top-4 z-[70] grid gap-2">
  {#each $toasts as toast (toast.id)}
    <div
      class={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow ${
        toast.kind === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {toast.message}
    </div>
  {/each}
</div>

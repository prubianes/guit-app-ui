<script lang="ts">
  import { toasts } from "$lib/components/toastStore";
</script>

<div class="pointer-events-none fixed right-4 top-4 z-[70] grid gap-2">
  {#each $toasts as toast (toast.id)}
    <div
      class={`pointer-events-auto relative max-w-sm overflow-hidden rounded-2xl border px-4 py-3 text-sm shadow-[var(--shadow-sm)] backdrop-blur ${
        toast.kind === "error"
          ? "border-[color:color-mix(in_srgb,var(--danger)_45%,var(--line))] bg-[color:color-mix(in_srgb,var(--surface)_88%,var(--danger)_12%)] text-slate-900"
          : "border-[color:color-mix(in_srgb,var(--accent)_50%,var(--line))] bg-[color:color-mix(in_srgb,var(--surface)_90%,var(--accent)_10%)] text-slate-900"
      }`}
    >
      <span
        class={`absolute left-0 top-0 h-full w-1.5 ${
          toast.kind === "error" ? "bg-[var(--danger)]" : "bg-[var(--accent)]"
        }`}
      ></span>
      <p class="pl-2">{toast.message}</p>
    </div>
  {/each}
</div>

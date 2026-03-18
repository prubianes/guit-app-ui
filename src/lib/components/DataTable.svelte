<script lang="ts">
  import type { Snippet } from "svelte";

  type Column = { key: string; label: string };
  let {
    columns,
    rows,
    actions
  }: {
    columns: Column[];
    rows: Record<string, unknown>[];
    actions?: Snippet<[Record<string, unknown>]>;
  } = $props();
</script>

<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
  <table class="min-w-full divide-y divide-slate-200 text-sm">
    <thead class="bg-slate-50">
      <tr>
        {#each columns as column}
          <th class="px-4 py-3 text-left font-semibold text-slate-700">{column.label}</th>
        {/each}
        <th class="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100">
      {#each rows as row}
        <tr class="hover:bg-slate-50">
          {#each columns as column}
            <td class="px-4 py-3 text-slate-700">{String(row[column.key] ?? "-")}</td>
          {/each}
          <td class="px-4 py-3 text-right">
            {@render actions?.(row)}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

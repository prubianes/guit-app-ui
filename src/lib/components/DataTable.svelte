<script lang="ts">
  import type { Snippet } from "svelte";

  type Column = {
    key: string;
    label: string;
    sortable?: boolean;
    type?: "text" | "currency" | "date";
  };
  let {
    columns,
    rows,
    actions,
    searchable = true
  }: {
    columns: Column[];
    rows: Record<string, unknown>[];
    actions?: Snippet<[Record<string, unknown>]>;
    searchable?: boolean;
  } = $props();

  let query = $state("");
  let sortKey = $state("");
  let sortDirection = $state<"asc" | "desc">("asc");

  $effect(() => {
    if (!sortKey && columns.length > 0) {
      sortKey = columns[0].key;
    }
  });

  const filteredRows = $derived.by(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) =>
      columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(q))
    );
  });

  const displayedRows = $derived.by(() => {
    if (!sortKey) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === bValue) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      const base = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
      return sortDirection === "asc" ? base : -base;
    });
  });

  const toggleSort = (column: Column) => {
    if (column.sortable === false) return;
    if (sortKey !== column.key) {
      sortKey = column.key;
      sortDirection = "asc";
      return;
    }
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  };

  const formatCell = (column: Column, value: unknown) => {
    if (value == null) return "-";
    if (column.type === "currency") {
      const numberValue = Number(value);
      if (Number.isFinite(numberValue)) {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD"
        }).format(numberValue);
      }
    }
    if (column.type === "date") {
      const parsed = new Date(String(value));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString();
      }
    }
    return String(value);
  };
</script>

<section class="orbit-card overflow-hidden">
  {#if searchable}
    <div class="border-b border-slate-200 p-3">
      <input
        type="search"
        placeholder="Search records"
        bind:value={query}
        class="orbit-input text-sm"
      />
    </div>
  {/if}
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
      <tr>
        {#each columns as column}
          <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
            <button type="button" class="inline-flex items-center gap-1.5" onclick={() => toggleSort(column)}>
              {column.label}
              {#if sortKey === column.key}
                <span class="text-[10px]">{sortDirection === "asc" ? "▲" : "▼"}</span>
              {/if}
            </button>
          </th>
        {/each}
        <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">Actions</th>
      </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#if displayedRows.length === 0}
          <tr>
            <td colspan={columns.length + 1} class="px-4 py-9 text-center text-sm text-slate-500">
              No matching records.
            </td>
          </tr>
        {/if}
        {#each displayedRows as row}
          <tr class="transition hover:bg-slate-50">
            {#each columns as column}
              <td class="px-4 py-3.5 text-slate-700">{formatCell(column, row[column.key])}</td>
            {/each}
            <td class="px-4 py-3.5 text-right">
              {@render actions?.(row)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

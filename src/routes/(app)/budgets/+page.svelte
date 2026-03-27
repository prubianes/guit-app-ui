<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import type { Budget } from "$lib/api/types";
  import Button from "$lib/components/Button.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import StateMessage from "$lib/components/StateMessage.svelte";
  import { toasts } from "$lib/components/toastStore";
  import type { PageData } from "./$types";

  let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();
  const fieldErrors = $derived((form?.fieldErrors || {}) as Record<string, string>);

  const columns = [
    { key: "categoryName", label: "Category" },
    { key: "period", label: "Period" },
    { key: "amount", label: "Amount", type: "currency" as const }
  ];
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const budgetsWithCategory = $derived(
    data.budgets.map((budget) => {
      const category = data.categories.find((item) => String(item.id) === String(budget.categoryId));
      return {
        ...budget,
        categoryName: category?.name ?? `Category #${budget.categoryId}`
      };
    })
  );
  const totalBudget = $derived(
    data.budgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0)
  );
  const averageBudget = $derived(
    data.budgets.length > 0 ? totalBudget / data.budgets.length : 0
  );
  const topBudget = $derived(
    [...budgetsWithCategory].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0] ?? null
  );
  const coveredCategories = $derived(
    new Set(data.budgets.map((budget) => String(budget.categoryId))).size
  );
  const periodBreakdown = $derived(
    (() => {
      const rows = [
        { period: "weekly", label: "Weekly", count: 0 },
        { period: "monthly", label: "Monthly", count: 0 },
        { period: "yearly", label: "Yearly", count: 0 }
      ];
      for (const budget of data.budgets) {
        const row = rows.find((item) => item.period === budget.period);
        if (row) row.count += 1;
      }
      const maxCount = Math.max(...rows.map((row) => row.count), 1);
      return rows.map((row) => ({
        ...row,
        percent: row.count === 0 ? 8 : Math.round((row.count / maxCount) * 100)
      }));
    })()
  );

  let modalOpen = $state(false);
  let confirmOpen = $state(false);
  let selected: Budget | null = $state(null);
  let submitting = $state(false);

  const openCreate = () => {
    selected = null;
    modalOpen = true;
  };

  const openEdit = (budget: Budget) => {
    selected = budget;
    modalOpen = true;
  };

  const openDelete = (budget: Budget) => {
    selected = budget;
    confirmOpen = true;
  };

  const done = async (ok: boolean, good: string, bad: string) => {
    if (ok) {
      modalOpen = false;
      confirmOpen = false;
      selected = null;
      toasts.success(good);
      await invalidateAll();
      return;
    }
    toasts.error(bad);
  };
</script>

<main class="space-y-3">
  <section class="orbit-frame flex flex-wrap items-center justify-between gap-2 p-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Budgets</h1>
      <p class="text-sm text-slate-600">Set spending limits by category and period.</p>
    </div>
    <Button on:click={openCreate}>New budget</Button>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load budgets" message={data.loadError} tone="error" />
  {:else if data.budgets.length === 0}
    <StateMessage title="No budgets yet" message="Create a budget to monitor category spending limits." />
  {:else}
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Total budgeted</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalBudget)}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Budget entries</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{data.budgets.length}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Avg budget amount</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(averageBudget)}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Category coverage</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{coveredCategories}/{data.categories.length}</p>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
      <article class="orbit-card p-4">
        <h2 class="text-lg font-semibold text-slate-900">Budget cadence mix</h2>
        <p class="mt-1 text-sm text-slate-600">How your budgets are distributed across periods.</p>
        <div class="mt-4 space-y-3">
          {#each periodBreakdown as row}
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-800">{row.label}</span>
                <span class="text-slate-600">{row.count}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                <div class="h-full rounded-full" style={`width:${row.percent}%; background: var(--accent);`}></div>
              </div>
            </div>
          {/each}
        </div>
      </article>

      <article class="orbit-card p-4">
        <h2 class="text-lg font-semibold text-slate-900">Largest allocation</h2>
        <p class="mt-1 text-sm text-slate-600">Your biggest budgeted category at a glance.</p>
        {#if topBudget}
          <div class="mt-4 rounded-xl border border-slate-200 p-4">
            <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Top category</p>
            <p class="mt-1 text-base font-semibold text-slate-900">{topBudget.categoryName}</p>
            <p class="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(Number(topBudget.amount || 0))}</p>
            <p class="text-xs text-slate-600">Period: {topBudget.period}</p>
          </div>
        {/if}
      </article>
    </section>

    <DataTable columns={columns} rows={budgetsWithCategory}>
      {#snippet actions(row)}
        <div class="inline-flex gap-2">
          <Button variant="ghost" class="!px-2 !py-1 text-xs" on:click={() => openEdit(row as Budget)}>Edit</Button>
          <Button variant="danger" class="!px-2 !py-1 text-xs" on:click={() => openDelete(row as Budget)}>Delete</Button>
        </div>
      {/snippet}
    </DataTable>
  {/if}

  <Modal open={modalOpen} title={selected ? "Edit budget" : "Create budget"} on:close={() => (modalOpen = false)}>
    <form
      method="POST"
      action={selected ? "?/update" : "?/create"}
      class="grid gap-3"
      use:enhance={() => {
        submitting = true;
        return async ({ result, update }) => {
          if (result.type === "success") {
            submitting = false;
            await done(true, selected ? "Budget updated." : "Budget created.", "Request failed.");
            return;
          }
          if (result.type === "failure") {
            await update();
            submitting = false;
          }
          if (result.type === "error" || result.type === "redirect") {
            submitting = false;
          }
          await done(false, "", "Could not save budget.");
        };
      }}
    >
      {#if form?.message}
        <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(form.message)}
        </div>
      {/if}
      {#if selected}
        <input type="hidden" name="budgetId" value={selected.id} />
      {/if}
      <label class="grid gap-1.5">
        <span class="text-sm font-medium text-slate-700">Category</span>
        <select
          name="categoryId"
          class="orbit-select text-sm"
          value={selected?.categoryId || ""}
          aria-invalid={Boolean(fieldErrors.categoryId)}
          required
        >
          <option value="" disabled>Select category</option>
          {#each data.categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
        {#if fieldErrors.categoryId}
          <span class="text-xs text-red-600">{fieldErrors.categoryId}</span>
        {/if}
      </label>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Amount</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            value={selected?.amount || 0}
            class="orbit-input text-sm"
            aria-invalid={Boolean(fieldErrors.amount)}
            required
          />
          {#if fieldErrors.amount}
            <span class="text-xs text-red-600">{fieldErrors.amount}</span>
          {/if}
        </label>
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Period</span>
          <select
            name="period"
            class="orbit-select text-sm"
            value={selected?.period || "monthly"}
            aria-invalid={Boolean(fieldErrors.period)}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {#if fieldErrors.period}
            <span class="text-xs text-red-600">{fieldErrors.period}</span>
          {/if}
        </label>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Start date</span>
          <input
            name="startDate"
            type="date"
            value={selected?.startDate?.slice(0, 10) || ""}
            class="orbit-input text-sm"
          />
        </label>
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">End date</span>
          <input
            name="endDate"
            type="date"
            value={selected?.endDate?.slice(0, 10) || ""}
            class="orbit-input text-sm"
          />
        </label>
      </div>
      <div class="mt-2 flex justify-end gap-2">
        <Button variant="ghost" on:click={() => (modalOpen = false)} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : selected ? "Save changes" : "Create"}
        </Button>
      </div>
    </form>
  </Modal>

  <ConfirmDialog
    open={confirmOpen}
    title="Delete budget"
    description="The budget will be permanently removed."
    on:cancel={() => (confirmOpen = false)}
    on:confirm={() => {
      const formNode = document.getElementById("delete-budget-form") as HTMLFormElement | null;
      formNode?.requestSubmit();
    }}
  />

  <form
    id="delete-budget-form"
    method="POST"
    action="?/delete"
    class="hidden"
    use:enhance={() => {
      return async ({ result }) => {
        if (result.type === "success") {
          await done(true, "Budget deleted.", "Delete failed.");
          return;
        }
        await done(false, "", "Could not delete budget.");
      };
    }}
  >
    <input type="hidden" name="budgetId" value={selected?.id || ""} />
  </form>
</main>

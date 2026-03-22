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
    { key: "categoryId", label: "Category" },
    { key: "period", label: "Period" },
    { key: "amount", label: "Amount", type: "currency" as const }
  ];

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

<main class="space-y-4">
  <section class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Budgets</h1>
      <p class="text-sm text-slate-600">Budget create/update requires a valid owned category.</p>
    </div>
    <Button on:click={openCreate}>New budget</Button>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load budgets" message={data.loadError} tone="error" />
  {:else if data.budgets.length === 0}
    <StateMessage title="No budgets yet" message="Create a budget to monitor category spending limits." />
  {:else}
    <DataTable columns={columns} rows={data.budgets}>
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
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={selected?.categoryId || ""}
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
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={selected?.period || "monthly"}
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
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">End date</span>
          <input
            name="endDate"
            type="date"
            value={selected?.endDate?.slice(0, 10) || ""}
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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

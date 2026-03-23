<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import type { Transaction } from "$lib/api/types";
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
    { key: "description", label: "Description" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount", type: "currency" as const },
    { key: "date", label: "Date", type: "date" as const }
  ];

  let modalOpen = $state(false);
  let confirmOpen = $state(false);
  let selected: Transaction | null = $state(null);
  let submitting = $state(false);
  let formAccountId = $state("");
  let formCategoryId = $state("");
  let formType = $state<"income" | "expense">("expense");

  const filteredCategories = $derived(
    data.categories.filter((category) => (category.kind ?? "expense") === formType)
  );

  const openCreate = () => {
    selected = null;
    formAccountId = "";
    formCategoryId = "";
    formType = "expense";
    modalOpen = true;
  };

  const openEdit = (transaction: Transaction) => {
    selected = transaction;
    formAccountId = String(transaction.accountId ?? "");
    formCategoryId = String(transaction.categoryId ?? "");
    formType = transaction.type;
    modalOpen = true;
  };

  const openDelete = (transaction: Transaction) => {
    selected = transaction;
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

  const onTypeChange = (event: Event) => {
    formType = (event.currentTarget as HTMLSelectElement).value as "income" | "expense";
    const selectedCategoryStillValid = data.categories.some(
      (category) =>
        String(category.id) === String(formCategoryId) && (category.kind ?? "expense") === formType
    );
    if (!selectedCategoryStillValid) {
      formCategoryId = "";
    }
  };
</script>

<main class="space-y-4">
  <section class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Transactions</h1>
      <p class="text-sm text-slate-600">
        Transaction create/update requires valid owned account and category.
      </p>
    </div>
    <Button on:click={openCreate}>New transaction</Button>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load transactions" message={data.loadError} tone="error" />
  {:else if data.transactions.length === 0}
    <StateMessage title="No transactions yet" message="Create your first transaction entry." />
  {:else}
    <DataTable columns={columns} rows={data.transactions}>
      {#snippet actions(row)}
        <div class="inline-flex gap-2">
          <Button variant="ghost" class="!px-2 !py-1 text-xs" on:click={() => openEdit(row as Transaction)}>Edit</Button>
          <Button variant="danger" class="!px-2 !py-1 text-xs" on:click={() => openDelete(row as Transaction)}>Delete</Button>
        </div>
      {/snippet}
    </DataTable>
  {/if}

  <Modal open={modalOpen} title={selected ? "Edit transaction" : "Create transaction"} on:close={() => (modalOpen = false)}>
    <form
      method="POST"
      action={selected ? "?/update" : "?/create"}
      class="grid gap-3"
      use:enhance={() => {
        submitting = true;
        return async ({ result, update }) => {
          if (result.type === "success") {
            submitting = false;
            await done(true, selected ? "Transaction updated." : "Transaction created.", "Request failed.");
            return;
          }
          if (result.type === "failure") {
            await update();
            submitting = false;
          }
          if (result.type === "error" || result.type === "redirect") {
            submitting = false;
          }
          await done(false, "", "Could not save transaction.");
        };
      }}
    >
      {#if form?.message}
        <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(form.message)}
        </div>
      {/if}
      {#if selected}
        <input type="hidden" name="transactionId" value={selected.id} />
      {/if}
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Account</span>
          <select
            name="accountId"
            class="h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            bind:value={formAccountId}
            required
          >
            <option value="" disabled>Select account</option>
            {#each data.accounts as account}
              <option value={account.id}>{account.name}</option>
            {/each}
          </select>
          {#if fieldErrors.accountId}
            <span class="text-xs text-red-600">{fieldErrors.accountId}</span>
          {/if}
        </label>

        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Type</span>
          <select
            name="type"
            class="h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            bind:value={formType}
            onchange={onTypeChange}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          {#if fieldErrors.type}
            <span class="text-xs text-red-600">{fieldErrors.type}</span>
          {/if}
        </label>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Category</span>
          <select
            name="categoryId"
            class="h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            bind:value={formCategoryId}
            required
          >
            <option value="" disabled>
              {filteredCategories.length > 0 ? `Select ${formType} category` : `No ${formType} categories`}
            </option>
            {#each filteredCategories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
          {#if fieldErrors.categoryId}
            <span class="text-xs text-red-600">{fieldErrors.categoryId}</span>
          {/if}
        </label>

        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Amount</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={selected?.amount || 0}
            required
          />
          {#if fieldErrors.amount}
            <span class="text-xs text-red-600">{fieldErrors.amount}</span>
          {/if}
        </label>
      </div>

      <label class="grid gap-1.5">
        <span class="text-sm font-medium text-slate-700">Date</span>
        <input
          name="occurredAt"
          type="date"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={(selected?.date || selected?.occurredAt || "").slice(0, 10)}
          required
        />
        {#if fieldErrors.date || fieldErrors.occurredAt}
          <span class="text-xs text-red-600">{fieldErrors.date || fieldErrors.occurredAt}</span>
        {/if}
      </label>

      <label class="grid gap-1.5">
        <span class="text-sm font-medium text-slate-700">Description</span>
        <input
          name="description"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={selected?.description || ""}
        />
      </label>

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
    title="Delete transaction"
    description="This transaction will be permanently removed."
    on:cancel={() => (confirmOpen = false)}
    on:confirm={() => {
      const formNode = document.getElementById("delete-transaction-form") as HTMLFormElement | null;
      formNode?.requestSubmit();
    }}
  />

  <form
    id="delete-transaction-form"
    method="POST"
    action="?/delete"
    class="hidden"
    use:enhance={() => {
      return async ({ result }) => {
        if (result.type === "success") {
          await done(true, "Transaction deleted.", "Delete failed.");
          return;
        }
        await done(false, "", "Could not delete transaction.");
      };
    }}
  >
    <input type="hidden" name="transactionId" value={selected?.id || ""} />
  </form>
</main>

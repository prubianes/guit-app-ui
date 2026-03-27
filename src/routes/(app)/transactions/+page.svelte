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
    { key: "accountName", label: "Account" },
    { key: "categoryName", label: "Category" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount", type: "currency" as const },
    { key: "date", label: "Date", type: "date" as const }
  ];
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const transactionsWithDetails = $derived(
    data.transactions.map((transaction) => {
      const account = data.accounts.find((item) => String(item.id) === String(transaction.accountId));
      const category = data.categories.find((item) => String(item.id) === String(transaction.categoryId));
      return {
        ...transaction,
        accountName: account?.name ?? `Account #${transaction.accountId}`,
        categoryName: category?.name ?? `Category #${transaction.categoryId}`
      };
    })
  );
  const incomeTotal = $derived(
    data.transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
  );
  const expenseTotal = $derived(
    data.transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
  );
  const netFlow = $derived(incomeTotal - expenseTotal);
  const averageAmount = $derived(
    data.transactions.length > 0
      ? data.transactions.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0) /
          data.transactions.length
      : 0
  );
  const recentThirtyDayCount = $derived(
    data.transactions.filter((transaction) => {
      const raw = transaction.date ?? transaction.occurredAt;
      const timestamp = raw ? new Date(raw).getTime() : Number.NaN;
      const threshold = Date.now() - 1000 * 60 * 60 * 24 * 30;
      return Number.isFinite(timestamp) && timestamp >= threshold;
    }).length
  );
  const topExpense = $derived(
    [...transactionsWithDetails]
      .filter((transaction) => transaction.type === "expense")
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0] ?? null
  );
  const categoryExpenseBreakdown = $derived(
    (() => {
      const totals = new Map<string, number>();
      for (const transaction of transactionsWithDetails) {
        if (transaction.type !== "expense") continue;
        totals.set(
          transaction.categoryName,
          (totals.get(transaction.categoryName) ?? 0) + Number(transaction.amount || 0)
        );
      }
      const rows = Array.from(totals.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      const max = rows.reduce((value, row) => Math.max(value, row.total), 0) || 1;
      return rows.map((row) => ({
        ...row,
        percent: Math.max(10, Math.round((row.total / max) * 100))
      }));
    })()
  );

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

<main class="space-y-3">
  <section class="orbit-frame flex flex-wrap items-center justify-between gap-2 p-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Transactions</h1>
      <p class="text-sm text-slate-600">Record money movement across accounts and categories.</p>
    </div>
    <Button on:click={openCreate}>New transaction</Button>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load transactions" message={data.loadError} tone="error" />
  {:else if data.transactions.length === 0}
    <StateMessage title="No transactions yet" message="Create your first transaction entry." />
  {:else}
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Net flow</p>
        <p class={`mt-2 text-2xl font-semibold ${netFlow >= 0 ? "text-emerald-700" : "text-red-700"}`}>
          {netFlow >= 0 ? "+" : ""}{formatCurrency(netFlow)}
        </p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Income total</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(incomeTotal)}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Expense total</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(expenseTotal)}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Avg transaction</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(averageAmount)}</p>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
      <article class="orbit-card p-4">
        <h2 class="text-lg font-semibold text-slate-900">Expense concentration</h2>
        <p class="mt-1 text-sm text-slate-600">Top spending categories in your current dataset.</p>
        <div class="mt-4 space-y-3">
          {#each categoryExpenseBreakdown as row}
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-800">{row.category}</span>
                <span class="text-slate-600">{formatCurrency(row.total)}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                <div class="h-full rounded-full" style={`width:${row.percent}%; background: var(--danger);`}></div>
              </div>
            </div>
          {/each}
        </div>
      </article>

      <article class="orbit-card p-4">
        <h2 class="text-lg font-semibold text-slate-900">Activity pulse</h2>
        <p class="mt-1 text-sm text-slate-600">Recent movement and largest expense marker.</p>
        <div class="mt-4 space-y-3">
          <div class="rounded-xl border border-slate-200 px-3 py-2">
            <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Last 30 days</p>
            <p class="mt-1 text-lg font-semibold text-slate-900">{recentThirtyDayCount} transactions</p>
          </div>
          {#if topExpense}
            <div class="rounded-xl border border-slate-200 px-3 py-2">
              <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Largest expense</p>
              <p class="mt-1 text-sm font-semibold text-slate-900">{topExpense.description || topExpense.categoryName}</p>
              <p class="text-sm text-slate-600">
                {formatCurrency(Number(topExpense.amount || 0))} · {topExpense.accountName}
              </p>
            </div>
          {/if}
        </div>
      </article>
    </section>

    <DataTable columns={columns} rows={transactionsWithDetails}>
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
            class="orbit-select text-sm"
            bind:value={formAccountId}
            aria-invalid={Boolean(fieldErrors.accountId)}
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
            class="orbit-select text-sm"
            bind:value={formType}
            onchange={onTypeChange}
            aria-invalid={Boolean(fieldErrors.type)}
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
            class="orbit-select text-sm"
            bind:value={formCategoryId}
            aria-invalid={Boolean(fieldErrors.categoryId)}
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
            class="orbit-input text-sm"
            value={selected?.amount || 0}
            aria-invalid={Boolean(fieldErrors.amount)}
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
          class="orbit-input text-sm"
          value={(selected?.date || selected?.occurredAt || "").slice(0, 10)}
          aria-invalid={Boolean(fieldErrors.date || fieldErrors.occurredAt)}
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
          class="orbit-input text-sm"
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

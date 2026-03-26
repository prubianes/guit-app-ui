<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import type { Account } from "$lib/api/types";
  import Button from "$lib/components/Button.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import FormField from "$lib/components/FormField.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import StateMessage from "$lib/components/StateMessage.svelte";
  import { toasts } from "$lib/components/toastStore";
  import type { PageData } from "./$types";

  let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();
  const fieldErrors = $derived((form?.fieldErrors || {}) as Record<string, string>);

  const columns = [
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "currency", label: "Currency" },
    { key: "balance", label: "Balance", type: "currency" as const }
  ];
  const accountTypeOptions = [
    { value: "checking", label: "Checking" },
    { value: "savings", label: "Savings" },
    { value: "cash", label: "Cash" },
    { value: "credit_card", label: "Credit Card" },
    { value: "investment", label: "Investment" },
    { value: "loan", label: "Loan" },
    { value: "other", label: "Other" }
  ];
  const typeLabel = (value: string) =>
    accountTypeOptions.find((option) => option.value === value)?.label ?? value;
  const formatCurrency = (value: number, currency = "USD") => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  let modalOpen = $state(false);
  let confirmOpen = $state(false);
  let selected: Account | null = $state(null);
  let submitting = $state(false);
  let deleting = $state(false);

  const totalBalance = $derived(data.accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0));
  const positiveAccounts = $derived(data.accounts.filter((account) => Number(account.balance) >= 0).length);
  const debtAccounts = $derived(data.accounts.filter((account) => Number(account.balance) < 0).length);
  const largestAccount = $derived(
    [...data.accounts].sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))[0] ?? null
  );
  const balancesByType = $derived(
    (() => {
      const totals = new Map<string, number>();
      for (const account of data.accounts) {
        totals.set(account.type, (totals.get(account.type) ?? 0) + Number(account.balance || 0));
      }
      const rows = Array.from(totals.entries()).map(([type, total]) => ({ type, total }));
      const maxAbs = rows.reduce((max, row) => Math.max(max, Math.abs(row.total)), 0) || 1;
      return rows
        .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
        .map((row) => ({
          ...row,
          percent: Math.max(6, Math.round((Math.abs(row.total) / maxAbs) * 100))
        }));
    })()
  );
  const totalsByCurrency = $derived(
    (() => {
      const totals = new Map<string, number>();
      for (const account of data.accounts) {
        totals.set(account.currency, (totals.get(account.currency) ?? 0) + Number(account.balance || 0));
      }
      return Array.from(totals.entries())
        .map(([currency, total]) => ({ currency, total }))
        .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    })()
  );

  const openCreate = () => {
    selected = null;
    modalOpen = true;
  };

  const openEdit = (account: Account) => {
    selected = account;
    modalOpen = true;
  };

  const openDelete = (account: Account) => {
    selected = account;
    confirmOpen = true;
  };

  const onActionDone = async (ok: boolean, successMsg: string, failMsg: string) => {
    if (ok) {
      modalOpen = false;
      confirmOpen = false;
      selected = null;
      toasts.success(successMsg);
      await invalidateAll();
      return;
    }
    toasts.error(failMsg);
  };
</script>

<main class="space-y-3">
  <section class="orbit-frame flex flex-wrap items-center justify-between gap-2 p-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Accounts</h1>
      <p class="text-sm text-slate-600">Track balances and account mix.</p>
    </div>
    <Button on:click={openCreate}>New account</Button>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load accounts" message={data.loadError} tone="error" />
  {:else if data.accounts.length === 0}
    <StateMessage title="No accounts yet" message="Create your first account to start tracking balances." />
  {:else}
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Total balance</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalBalance)}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Accounts tracked</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{data.accounts.length}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Positive accounts</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{positiveAccounts}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Debt accounts</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{debtAccounts}</p>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
      <article class="orbit-card p-4">
        <h2 class="text-lg font-semibold text-slate-900">Balance by type</h2>
        <p class="mt-1 text-sm text-slate-600">Quick visual split of where your money sits.</p>
        <div class="mt-4 space-y-3">
          {#each balancesByType as bucket}
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-800">{typeLabel(bucket.type)}</span>
                <span class={bucket.total >= 0 ? "text-slate-700" : "text-red-700"}>
                  {formatCurrency(bucket.total)}
                </span>
              </div>
              <div class="h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                <div
                  class="h-full rounded-full"
                  style={`width: ${bucket.percent}%; background: ${bucket.total >= 0 ? "var(--success)" : "var(--danger)"};`}
                ></div>
              </div>
            </div>
          {/each}
        </div>
      </article>

      <article class="orbit-card p-4">
        <h2 class="text-lg font-semibold text-slate-900">Distribution</h2>
        <p class="mt-1 text-sm text-slate-600">Balance grouped by currency and largest account.</p>
        <div class="mt-4 space-y-3">
          {#if largestAccount}
            <div class="rounded-xl border border-slate-200 p-3">
              <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Largest account</p>
              <p class="mt-1 text-sm font-semibold text-slate-900">{largestAccount.name}</p>
              <p class="text-sm text-slate-600">
                {formatCurrency(Number(largestAccount.balance || 0), largestAccount.currency)}
              </p>
            </div>
          {/if}
          <div class="grid gap-2">
            {#each totalsByCurrency as item}
              <div class="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <span class="font-medium text-slate-800">{item.currency}</span>
                <span class={item.total >= 0 ? "text-slate-700" : "text-red-700"}>
                  {formatCurrency(item.total, item.currency)}
                </span>
              </div>
            {/each}
          </div>
        </div>
      </article>
    </section>

    <DataTable columns={columns} rows={data.accounts}>
      {#snippet actions(row)}
        <div class="inline-flex gap-2">
          <Button variant="ghost" class="!px-2 !py-1 text-xs" on:click={() => openEdit(row as Account)}>Edit</Button>
          <Button variant="danger" class="!px-2 !py-1 text-xs" on:click={() => openDelete(row as Account)}>Delete</Button>
        </div>
      {/snippet}
    </DataTable>
  {/if}

  <Modal open={modalOpen} title={selected ? "Edit account" : "Create account"} on:close={() => (modalOpen = false)}>
    <form
      method="POST"
      action={selected ? "?/update" : "?/create"}
      class="grid gap-3"
      use:enhance={() => {
        submitting = true;
        return async ({ result, update }) => {
          if (result.type === "success") {
            submitting = false;
            await onActionDone(true, selected ? "Account updated." : "Account created.", "Request failed.");
            return;
          }
          if (result.type === "failure") {
            await update();
            submitting = false;
            await onActionDone(false, "", "Could not save account.");
          }
          if (result.type === "error" || result.type === "redirect") {
            submitting = false;
          }
        };
      }}
    >
      {#if form?.message}
        <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(form.message)}
        </div>
      {/if}
      {#if selected}
        <input type="hidden" name="accountId" value={selected.id} />
      {/if}
      <FormField
        label="Name"
        name="name"
        value={selected?.name || ""}
        error={fieldErrors.name}
        required
      />
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Type</span>
          <select
            name="type"
            class="orbit-select text-sm"
            required
            value={selected?.type || "checking"}
            aria-invalid={Boolean(fieldErrors.type)}
          >
            {#if selected}
              {@const selectedType = selected.type}
              {#if !accountTypeOptions.some((option) => option.value === selectedType)}
                <option value={selectedType}>{selectedType}</option>
              {/if}
            {/if}
            {#each accountTypeOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          {#if fieldErrors.type}
            <span class="text-xs text-red-600">{fieldErrors.type}</span>
          {/if}
        </label>
        <FormField
          label="Currency"
          name="currency"
          value={selected?.currency || "USD"}
          error={fieldErrors.currency}
          required
        />
      </div>
      <FormField
        label="Balance"
        name="balance"
        type="number"
        value={selected?.balance || 0}
        error={fieldErrors.balance}
        required
      />
      <FormField label="Institution" name="institution" value={selected?.institution || ""} />
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
    title="Delete account"
    description="This action cannot be undone."
    on:cancel={() => (confirmOpen = false)}
    on:confirm={() => {
      const formNode = document.getElementById("delete-account-form") as HTMLFormElement | null;
      formNode?.requestSubmit();
    }}
  />

  <form
    id="delete-account-form"
    method="POST"
    action="?/delete"
    class="hidden"
    use:enhance={() => {
      deleting = true;
      return async ({ result, update }) => {
        if (result.type === "success") {
          deleting = false;
          await onActionDone(true, "Account deleted.", "Delete failed.");
          return;
        }
        if (result.type === "failure") {
          await update();
          deleting = false;
          await onActionDone(false, "", "Could not delete account.");
        }
        if (result.type === "error" || result.type === "redirect") {
          deleting = false;
        }
      };
    }}
  >
    <input type="hidden" name="accountId" value={selected?.id || ""} />
  </form>
</main>

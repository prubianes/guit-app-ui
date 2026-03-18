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

  let { data }: { data: PageData } = $props();

  const columns = [
    { key: "description", label: "Description" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "occurredAt", label: "Date" }
  ];

  let modalOpen = $state(false);
  let confirmOpen = $state(false);
  let selected: Transaction | null = $state(null);

  const openCreate = () => {
    selected = null;
    modalOpen = true;
  };

  const openEdit = (transaction: Transaction) => {
    selected = transaction;
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
        return async ({ result }) => {
          if (result.type === "success") {
            await done(true, selected ? "Transaction updated." : "Transaction created.", "Request failed.");
            return;
          }
          await done(false, "", "Could not save transaction.");
        };
      }}
    >
      {#if selected}
        <input type="hidden" name="transactionId" value={selected.id} />
      {/if}
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Account</span>
          <select
            name="accountId"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={selected?.accountId || ""}
            required
          >
            <option value="" disabled>Select account</option>
            {#each data.accounts as account}
              <option value={account.id}>{account.name}</option>
            {/each}
          </select>
        </label>
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
        </label>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Type</span>
          <select name="type" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={selected?.type || "expense"}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
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
        </label>
      </div>

      <label class="grid gap-1.5">
        <span class="text-sm font-medium text-slate-700">Date</span>
        <input
          name="occurredAt"
          type="date"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={selected?.occurredAt?.slice(0, 10) || ""}
          required
        />
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
        <Button variant="ghost" on:click={() => (modalOpen = false)}>Cancel</Button>
        <Button type="submit">{selected ? "Save changes" : "Create"}</Button>
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

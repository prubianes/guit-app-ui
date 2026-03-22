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

  let modalOpen = $state(false);
  let confirmOpen = $state(false);
  let selected: Account | null = $state(null);
  let submitting = $state(false);
  let deleting = $state(false);

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

<main class="space-y-4">
  <section class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Accounts</h1>
      <p class="text-sm text-slate-600">Manage user-owned financial accounts.</p>
    </div>
    <Button on:click={openCreate}>New account</Button>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load accounts" message={data.loadError} tone="error" />
  {:else if data.accounts.length === 0}
    <StateMessage title="No accounts yet" message="Create your first account to start tracking balances." />
  {:else}
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
        <FormField
          label="Type"
          name="type"
          value={selected?.type || ""}
          error={fieldErrors.type}
          required
        />
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

<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import type { Category } from "$lib/api/types";
  import Button from "$lib/components/Button.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import StateMessage from "$lib/components/StateMessage.svelte";
  import { toasts } from "$lib/components/toastStore";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const columns = [
    { key: "name", label: "Name" },
    { key: "kind", label: "Kind" },
    { key: "color", label: "Color" }
  ];

  let modalOpen = $state(false);
  let confirmOpen = $state(false);
  let selected: Category | null = $state(null);

  const openCreate = () => {
    selected = null;
    modalOpen = true;
  };

  const openEdit = (category: Category) => {
    selected = category;
    modalOpen = true;
  };

  const openDelete = (category: Category) => {
    selected = category;
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
      <h1 class="text-2xl font-bold text-slate-900">Categories</h1>
      <p class="text-sm text-slate-600">Categories are user-specific and used by transactions and budgets.</p>
    </div>
    <Button on:click={openCreate}>New category</Button>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load categories" message={data.loadError} tone="error" />
  {:else if data.categories.length === 0}
    <StateMessage title="No categories yet" message="Create categories before adding transactions or budgets." />
  {:else}
    <DataTable columns={columns} rows={data.categories}>
      {#snippet actions(row)}
        <div class="inline-flex gap-2">
          <Button variant="ghost" class="!px-2 !py-1 text-xs" on:click={() => openEdit(row as Category)}>Edit</Button>
          <Button variant="danger" class="!px-2 !py-1 text-xs" on:click={() => openDelete(row as Category)}>Delete</Button>
        </div>
      {/snippet}
    </DataTable>
  {/if}

  <Modal open={modalOpen} title={selected ? "Edit category" : "Create category"} on:close={() => (modalOpen = false)}>
    <form
      method="POST"
      action={selected ? "?/update" : "?/create"}
      class="grid gap-3"
      use:enhance={() => {
        return async ({ result }) => {
          if (result.type === "success") {
            await done(true, selected ? "Category updated." : "Category created.", "Request failed.");
            return;
          }
          await done(false, "", "Could not save category.");
        };
      }}
    >
      {#if selected}
        <input type="hidden" name="categoryId" value={selected.id} />
      {/if}
      <label class="grid gap-1.5">
        <span class="text-sm font-medium text-slate-700">Name</span>
        <input
          name="name"
          required
          value={selected?.name || ""}
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </label>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Type</span>
          <select
            name="kind"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={selected?.kind || "expense"}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Color</span>
          <input
            name="color"
            type="text"
            value={selected?.color || "#334155"}
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div class="mt-2 flex justify-end gap-2">
        <Button variant="ghost" on:click={() => (modalOpen = false)}>Cancel</Button>
        <Button type="submit">{selected ? "Save changes" : "Create"}</Button>
      </div>
    </form>
  </Modal>

  <ConfirmDialog
    open={confirmOpen}
    title="Delete category"
    description="Any budgets or transactions using this category may fail after deletion."
    on:cancel={() => (confirmOpen = false)}
    on:confirm={() => {
      const formNode = document.getElementById("delete-category-form") as HTMLFormElement | null;
      formNode?.requestSubmit();
    }}
  />

  <form
    id="delete-category-form"
    method="POST"
    action="?/delete"
    class="hidden"
    use:enhance={() => {
      return async ({ result }) => {
        if (result.type === "success") {
          await done(true, "Category deleted.", "Delete failed.");
          return;
        }
        await done(false, "", "Could not delete category.");
      };
    }}
  >
    <input type="hidden" name="categoryId" value={selected?.id || ""} />
  </form>
</main>

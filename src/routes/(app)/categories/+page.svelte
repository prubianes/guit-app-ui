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

  let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();
  const fieldErrors = $derived((form?.fieldErrors || {}) as Record<string, string>);

  const columns = [
    { key: "name", label: "Name" },
    { key: "kind", label: "Kind" }
  ];
  const incomeCategories = $derived(
    data.categories.filter((category) => (category.kind ?? "expense") === "income").length
  );
  const expenseCategories = $derived(
    data.categories.filter((category) => (category.kind ?? "expense") === "expense").length
  );
  const dominantKind = $derived(
    incomeCategories === expenseCategories
      ? "Balanced"
      : incomeCategories > expenseCategories
        ? "Income-heavy"
        : "Expense-heavy"
  );
  const averageNameLength = $derived(
    data.categories.length === 0
      ? 0
      : Math.round(
          data.categories.reduce((sum, category) => sum + category.name.trim().length, 0) /
            data.categories.length
        )
  );
  const longestCategoryName = $derived(
    [...data.categories].sort((a, b) => b.name.length - a.name.length)[0]?.name ?? "-"
  );

  let modalOpen = $state(false);
  let confirmOpen = $state(false);
  let selected: Category | null = $state(null);
  let submitting = $state(false);

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

<main class="space-y-3">
  <section class="orbit-frame flex flex-wrap items-center justify-between gap-2 p-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Categories</h1>
      <p class="text-sm text-slate-600">Organize income and expense groups.</p>
    </div>
    <Button on:click={openCreate}>New category</Button>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load categories" message={data.loadError} tone="error" />
  {:else if data.categories.length === 0}
    <StateMessage title="No categories yet" message="Create categories before adding transactions or budgets." />
  {:else}
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Total categories</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{data.categories.length}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Expense categories</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{expenseCategories}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Income categories</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{incomeCategories}</p>
      </article>
      <article class="orbit-card p-4">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Category mix</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{dominantKind}</p>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
      <article class="orbit-card p-4">
        <h2 class="text-lg font-semibold text-slate-900">Income vs Expense split</h2>
        <p class="mt-1 text-sm text-slate-600">Ensure both flows are covered for cleaner reporting.</p>
        <div class="mt-4 h-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          <div
            class="h-full"
            style={`width: ${Math.max(8, Math.round((expenseCategories / Math.max(1, data.categories.length)) * 100))}%; background: var(--danger);`}
          ></div>
        </div>
        <div class="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span>Expense: {expenseCategories}</span>
          <span>Income: {incomeCategories}</span>
        </div>
      </article>

      <article class="orbit-card p-4">
        <h2 class="text-lg font-semibold text-slate-900">Naming insights</h2>
        <p class="mt-1 text-sm text-slate-600">Keep category labels concise and easy to scan.</p>
        <div class="mt-4 grid gap-2">
          <div class="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <span class="text-slate-600">Average name length</span>
            <span class="font-semibold text-slate-900">{averageNameLength} chars</span>
          </div>
          <div class="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <span class="text-slate-600">Longest category</span>
            <span class="max-w-[60%] truncate font-semibold text-slate-900">{longestCategoryName}</span>
          </div>
        </div>
      </article>
    </section>

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
        submitting = true;
        return async ({ result, update }) => {
          if (result.type === "success") {
            submitting = false;
            await done(true, selected ? "Category updated." : "Category created.", "Request failed.");
            return;
          }
          if (result.type === "failure") {
            await update();
            submitting = false;
          }
          if (result.type === "error" || result.type === "redirect") {
            submitting = false;
          }
          await done(false, "", "Could not save category.");
        };
      }}
    >
      {#if form?.message}
        <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(form.message)}
        </div>
      {/if}
      {#if selected}
        <input type="hidden" name="categoryId" value={selected.id} />
      {/if}
      <label class="grid gap-1.5">
        <span class="text-sm font-medium text-slate-700">Name</span>
        <input
          name="name"
          required
          value={selected?.name || ""}
          class="orbit-input text-sm"
          aria-invalid={Boolean(fieldErrors.name)}
        />
        {#if fieldErrors.name}
          <span class="text-xs text-red-600">{fieldErrors.name}</span>
        {/if}
      </label>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-slate-700">Type</span>
          <select
            name="kind"
            class="orbit-select text-sm"
            value={selected?.kind || "expense"}
            aria-invalid={Boolean(fieldErrors.kind)}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          {#if fieldErrors.kind}
            <span class="text-xs text-red-600">{fieldErrors.kind}</span>
          {/if}
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

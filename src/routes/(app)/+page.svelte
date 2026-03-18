<script lang="ts">
  import type { PageData } from "./$types";
  import StateMessage from "$lib/components/StateMessage.svelte";

  let { data }: { data: PageData } = $props();
</script>

<main class="space-y-4">
  <section class="rounded-2xl border border-slate-200 bg-white p-4">
    <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
    <p class="mt-1 text-sm text-slate-600">Overview of your current financial position.</p>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load dashboard" message={data.loadError} tone="error" />
  {/if}

  <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
    <article class="rounded-xl border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-500">Accounts</p>
      <p class="mt-2 text-2xl font-semibold text-slate-900">{data.stats.accounts}</p>
    </article>
    <article class="rounded-xl border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-500">Transactions</p>
      <p class="mt-2 text-2xl font-semibold text-slate-900">{data.stats.transactions}</p>
    </article>
    <article class="rounded-xl border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-500">Budgets</p>
      <p class="mt-2 text-2xl font-semibold text-slate-900">{data.stats.budgets}</p>
    </article>
    <article class="rounded-xl border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-500">Total balance</p>
      <p class="mt-2 text-2xl font-semibold text-slate-900">${data.stats.balanceTotal.toFixed(2)}</p>
    </article>
    <article class="rounded-xl border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-500">Expense total</p>
      <p class="mt-2 text-2xl font-semibold text-slate-900">${data.stats.monthlyExpenses.toFixed(2)}</p>
    </article>
  </section>
</main>

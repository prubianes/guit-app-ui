<script lang="ts">
  import type { PageData } from "./$types";
  import StateMessage from "$lib/components/StateMessage.svelte";

  let { data }: { data: PageData } = $props();
  const netTone = $derived(data.stats.netFlow >= 0 ? "text-emerald-700" : "text-red-700");
  const currency = (value: number) => `$${value.toFixed(2)}`;
</script>

<main class="space-y-4">
  <section class="rounded-2xl border border-slate-200 bg-white p-5">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Overview</p>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">Financial command center</h1>
        <p class="mt-2 text-sm text-slate-600">
          Track accounts, spending and budgets from a single place.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/transactions">
          Add transaction
        </a>
        <a class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/budgets">
          Set budget
        </a>
      </div>
    </div>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load dashboard" message={data.loadError} tone="error" />
  {/if}

  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <article class="rounded-2xl border border-slate-200 bg-white p-4">
      <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Total balance</p>
      <p class="mt-2 text-3xl font-semibold text-slate-900">{currency(data.stats.balanceTotal)}</p>
      <p class={`mt-1 text-xs font-medium ${netTone}`}>
        Net flow {data.stats.netFlow >= 0 ? "+" : ""}{currency(data.stats.netFlow)}
      </p>
    </article>
    <article class="rounded-2xl border border-slate-200 bg-white p-4">
      <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Expenses</p>
      <p class="mt-2 text-3xl font-semibold text-slate-900">{currency(data.stats.expenseTotal)}</p>
      <p class="mt-1 text-xs text-slate-600">{data.stats.recentTransactions} transactions in last 30 days</p>
    </article>
    <article class="rounded-2xl border border-slate-200 bg-white p-4">
      <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Income</p>
      <p class="mt-2 text-3xl font-semibold text-slate-900">{currency(data.stats.incomeTotal)}</p>
      <p class="mt-1 text-xs text-slate-600">Avg transaction {currency(data.stats.avgTransaction)}</p>
    </article>
    <article class="rounded-2xl border border-slate-200 bg-white p-4">
      <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Coverage</p>
      <p class="mt-2 text-3xl font-semibold text-slate-900">
        {data.stats.accounts}A / {data.stats.budgets}B
      </p>
      <p class="mt-1 text-xs text-slate-600">{data.stats.transactions} total transactions recorded</p>
    </article>
  </section>

  <section class="grid gap-4 lg:grid-cols-2">
    <article class="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 class="text-lg font-semibold text-slate-900">Momentum</h2>
      <p class="mt-1 text-sm text-slate-600">
        {#if data.stats.netFlow >= 0}
          You are cash-flow positive this period. Consider allocating more into savings goals.
        {:else}
          Spending is higher than income this period. Review expense categories and budget caps.
        {/if}
      </p>
      <div class="mt-4 h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div
          class="h-full rounded-full"
          style={`width: ${Math.min(
            100,
            Math.round(
              ((Math.abs(data.stats.netFlow) + data.stats.incomeTotal) /
                Math.max(1, data.stats.incomeTotal + data.stats.expenseTotal)) *
                100
            )
          )}%; background: ${data.stats.netFlow >= 0 ? "var(--success)" : "var(--danger)"};`}
        ></div>
      </div>
    </article>

    <article class="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 class="text-lg font-semibold text-slate-900">Quick actions</h2>
      <p class="mt-1 text-sm text-slate-600">Jump directly into the workflows you use most.</p>
      <div class="mt-4 grid gap-2 sm:grid-cols-2">
        <a class="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/accounts">
          Manage accounts
        </a>
        <a class="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/categories">
          Edit categories
        </a>
        <a class="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/transactions">
          Add transaction
        </a>
        <a class="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/budgets">
          Adjust budgets
        </a>
      </div>
    </article>
  </section>
</main>

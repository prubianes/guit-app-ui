<script lang="ts">
  import type { PageData } from "./$types";
  import StateMessage from "$lib/components/StateMessage.svelte";

  let { data }: { data: PageData } = $props();
  const netTone = $derived(data.stats.netFlow >= 0 ? "text-emerald-700" : "text-red-700");
  const currency = (value: number) => `$${value.toFixed(2)}`;
</script>

<main class="space-y-3">
  <section class="orbit-frame p-4 sm:p-5">
    <div class="orbit-marquee border-b border-slate-200 pb-3">
      <span>high pressure finance board</span>
      <span>cash under control</span>
      <span>budget watch active</span>
      <span>reserve stable</span>
    </div>
    <div class="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <div>
        <p class="orbit-label">Overview</p>
        <h1 class="mt-2 text-4xl font-semibold leading-[0.93] text-slate-900 sm:text-5xl">All money flows in one board.</h1>
        <p class="mt-3 max-w-xl text-sm text-slate-600">
          Review balances, spending, and budgets with focused signals and clear action points.
        </p>
      </div>
      <div class="grid content-end gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <a class="rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100" href="/transactions">
          Add transaction
        </a>
        <a class="rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100" href="/budgets">
          Adjust budgets
        </a>
      </div>
    </div>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load dashboard" message={data.loadError} tone="error" />
  {/if}

  <section class="orbit-metric-strip grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
    <article>
      <p class="orbit-label">Income</p>
      <p class="mt-1 text-2xl font-semibold text-slate-900">{currency(data.stats.incomeTotal)}</p>
    </article>
    <article>
      <p class="orbit-label">Expense</p>
      <p class="mt-1 text-2xl font-semibold text-slate-900">{currency(data.stats.expenseTotal)}</p>
    </article>
    <article>
      <p class="orbit-label">Net flow</p>
      <p class={`mt-1 text-2xl font-semibold ${netTone}`}>{data.stats.netFlow >= 0 ? "+" : ""}{currency(data.stats.netFlow)}</p>
    </article>
    <article>
      <p class="orbit-label">Transactions</p>
      <p class="mt-1 text-2xl font-semibold text-slate-900">{data.stats.transactions}</p>
    </article>
    <article>
      <p class="orbit-label">Accounts / Budgets</p>
      <p class="mt-1 text-2xl font-semibold text-slate-900">{data.stats.accounts}/{data.stats.budgets}</p>
    </article>
  </section>

  <section class="grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
    <article class="orbit-card p-5">
      <p class="orbit-label">Board summary</p>
      <p class="mt-2 text-4xl font-semibold text-slate-900">{currency(data.stats.balanceTotal)}</p>
      <p class="mt-2 text-sm text-slate-600">
        {#if data.stats.netFlow >= 0}
          Positive momentum this period. Keep budget pacing and reserve transfers.
        {:else}
          Spend is exceeding income. Review high-variance categories first.
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
          )}%; background: ${data.stats.netFlow >= 0 ? "var(--success)" : "var(--danger)"}; box-shadow: 0 0 20px ${data.stats.netFlow >= 0 ? "var(--success)" : "var(--danger)"};`}
        ></div>
      </div>
    </article>

    <article class="orbit-card p-5">
      <p class="orbit-label">Action rail</p>
      <h2 class="mt-2 text-xl font-semibold text-slate-900">Quick actions</h2>
      <div class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <a class="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100" href="/accounts">
          Manage accounts
        </a>
        <a class="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100" href="/categories">
          Edit categories
        </a>
        <a class="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100" href="/transactions">
          Add transaction
        </a>
        <a class="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100" href="/budgets">
          Adjust budgets
        </a>
      </div>
    </article>
  </section>
</main>

<script lang="ts">
  import { onMount } from "svelte";
  import type { LayoutData } from "./$types";
  import Button from "$lib/components/Button.svelte";

  let { data, children }: { data: LayoutData; children: import("svelte").Snippet } = $props();
  let theme = $state("light");

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/accounts", label: "Accounts" },
    { href: "/categories", label: "Categories" },
    { href: "/transactions", label: "Transactions" },
    { href: "/budgets", label: "Budgets" },
    { href: "/profile", label: "Profile" }
  ];

  const applyTheme = (next: string) => {
    theme = next;
    document.body.dataset.theme = next;
    localStorage.setItem("finance-theme", next);
  };

  const toggleTheme = () => {
    applyTheme(theme === "light" ? "dark" : "light");
  };

  onMount(() => {
    const storedTheme = localStorage.getItem("finance-theme");
    applyTheme(storedTheme === "dark" ? "dark" : "light");
  });
</script>

<div class="min-h-screen bg-slate-50">
  <div class="mx-auto flex w-full max-w-7xl gap-4 px-4 py-4 sm:px-6">
    <aside class="hidden w-64 shrink-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow)] lg:block">
      <div class="flex items-center gap-3">
        <div
          class="grid h-11 w-11 place-items-center rounded-2xl text-lg"
          style="background: var(--text); color: var(--bg); font-family: 'Palatino Linotype', serif;"
        >
          G
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Guit Finance</p>
          <p class="mt-1 text-sm text-slate-600">Personal finance manager</p>
        </div>
      </div>
      <nav class="mt-6 grid gap-1.5">
        {#each links as link}
          <a class="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href={link.href}>
            {link.label}
          </a>
        {/each}
      </nav>
      <div class="mt-6 space-y-2">
        <Button variant="ghost" class="w-full" on:click={toggleTheme}>Theme: {theme}</Button>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <header class="mb-4 rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-[var(--shadow)]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.18em] text-slate-500">Signed in as</p>
            <p class="text-sm font-semibold text-slate-800">{data.user.email}</p>
          </div>
          <Button variant="ghost" class="lg:hidden" on:click={toggleTheme}>Theme: {theme}</Button>
        </div>
      </header>
      {@render children()}
    </div>
  </div>
</div>

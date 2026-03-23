<script lang="ts">
  import { page } from "$app/stores";
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

  const isActive = (href: string, pathname: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinkClass = (href: string, pathname: string) =>
    `group flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
      isActive(href, pathname)
        ? "border-transparent text-[var(--bg)] shadow-sm"
        : "border-slate-200 text-slate-700 hover:bg-slate-100"
    }`;

  onMount(() => {
    const storedTheme = localStorage.getItem("finance-theme");
    applyTheme(storedTheme === "dark" ? "dark" : "light");
  });
</script>

<div class="min-h-screen bg-slate-50">
  <div class="mx-auto flex w-full max-w-7xl gap-4 px-4 py-4 sm:px-6">
    <aside class="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow)] lg:block">
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
        <p class="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
        {#each links as link}
          <a
            class={navLinkClass(link.href, $page.url.pathname)}
            href={link.href}
            style={isActive(link.href, $page.url.pathname) ? "background: var(--text);" : ""}
          >
            <span>{link.label}</span>
          </a>
        {/each}
      </nav>
      <div class="mt-6 border-t border-slate-200 pt-4">
        <p class="px-2 text-xs text-slate-500">Logged in as</p>
        <p class="truncate px-2 text-sm font-medium text-slate-800">{data.user.email}</p>
      </div>
      <div class="mt-4 space-y-2">
        <form method="POST" action="/profile?/logout">
          <Button type="submit" variant="danger" class="w-full">Logout</Button>
        </form>
        <Button variant="ghost" class="w-full" on:click={toggleTheme}>Theme: {theme}</Button>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <header class="mb-4 rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-[var(--shadow)] lg:hidden">
        <div class="flex flex-wrap items-center justify-end gap-3">
          <Button variant="ghost" class="lg:hidden" on:click={toggleTheme}>Theme: {theme}</Button>
        </div>
        <nav class="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {#each links as link}
            <a
              class={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                isActive(link.href, $page.url.pathname)
                  ? "border-transparent text-[var(--bg)]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              href={link.href}
              style={isActive(link.href, $page.url.pathname) ? "background: var(--text);" : ""}
            >
              {link.label}
            </a>
          {/each}
        </nav>
      </header>
      {@render children()}
    </div>
  </div>
</div>

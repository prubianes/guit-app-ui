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
    `group flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
      isActive(href, pathname)
        ? "border-transparent shadow-sm"
        : "border-slate-200 text-slate-700 hover:bg-slate-100"
    }`;

  onMount(() => {
    const storedTheme = localStorage.getItem("finance-theme");
    applyTheme(storedTheme === "dark" ? "dark" : "light");
  });
</script>

<div class="min-h-screen">
  <div class="orbit-shell">
    <header class="orbit-frame orbit-reveal mb-3 p-3 [--delay:0] lg:hidden">
      <div class="flex items-center justify-between gap-2">
        <a class="inline-flex items-center gap-2" href="/">
          <span
            class="grid h-10 w-10 place-items-center rounded-xl text-lg font-semibold"
            style="background: var(--accent); color: #fff;"
          >
            G
          </span>
          <div>
            <p class="orbit-label">Guit Finance</p>
            <p class="text-sm text-slate-700">Operations board</p>
          </div>
        </a>
        <Button variant="ghost" on:click={toggleTheme}>Theme: {theme}</Button>
      </div>
      <nav class="mt-3 grid grid-cols-3 gap-2">
        {#each links as link}
          <a
            class={`rounded-lg border px-2 py-2 text-center text-xs font-medium transition ${
              isActive(link.href, $page.url.pathname)
                ? "border-transparent"
                : "border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
            href={link.href}
            aria-current={isActive(link.href, $page.url.pathname) ? "page" : undefined}
            style={isActive(link.href, $page.url.pathname) ? "background: var(--text); color: var(--bg);" : ""}
          >
            {link.label}
          </a>
        {/each}
      </nav>
    </header>

    <div class="grid gap-3 lg:grid-cols-[292px_minmax(0,1fr)]">
      <aside class="orbit-frame orbit-reveal hidden h-[calc(100vh-2rem)] p-4 [--delay:0] lg:flex lg:sticky lg:top-4 lg:flex-col">
        <div class="flex items-center gap-3">
          <div
            class="grid h-11 w-11 place-items-center rounded-xl text-lg font-semibold"
            style="background: var(--accent); color: #fff;"
          >
            G
          </div>
          <div>
            <p class="orbit-label">Guit Finance</p>
            <p class="text-sm text-slate-700">Operations board</p>
          </div>
        </div>
        <div class="orbit-marquee mt-4 border-y border-slate-200 py-2">
          <span>cash under control</span>
          <span>budget watch active</span>
          <span>category flow aligned</span>
          <span>accounts synced</span>
        </div>
        <nav class="mt-4 grid gap-1.5">
          {#each links as link}
            <a
              class={navLinkClass(link.href, $page.url.pathname)}
              href={link.href}
              aria-current={isActive(link.href, $page.url.pathname) ? "page" : undefined}
              style={isActive(link.href, $page.url.pathname) ? "background: var(--text); color: var(--bg);" : ""}
            >
              <span>{link.label}</span>
            </a>
          {/each}
        </nav>
        <div class="mt-auto space-y-2 pt-4">
          <p class="orbit-label px-1">Signed in</p>
          <p class="truncate px-1 text-sm text-slate-800">{data.user.email}</p>
          <form method="POST" action="/profile?/logout">
            <Button type="submit" variant="danger" class="w-full">Logout</Button>
          </form>
          <Button variant="ghost" class="w-full" on:click={toggleTheme}>Theme: {theme}</Button>
        </div>
      </aside>

      <div class="min-w-0 space-y-3">
        <section class="orbit-frame orbit-reveal hidden p-4 [--delay:1] lg:block">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="orbit-label">Personal finance</p>
              <h1 class="mt-1 text-2xl font-semibold text-slate-900">Control panel</h1>
            </div>
            <div class="text-right">
              <p class="orbit-label">Operator</p>
              <p class="text-sm text-slate-700">{data.user.email}</p>
            </div>
          </div>
        </section>

        <div class="orbit-reveal [--delay:2]">
          {@render children()}
        </div>
      </div>
    </div>
  </div>
</div>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";
  import Button from "$lib/components/Button.svelte";
  import FormField from "$lib/components/FormField.svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import { toasts } from "$lib/components/toastStore";

  let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();
  const fieldErrors = $derived((form?.fieldErrors || {}) as Record<string, string>);
</script>

<main class="orbit-shell grid min-h-screen place-items-center py-8">
  <ThemeToggle class="fixed right-4 top-4 z-20" />
  <section class="orbit-frame orbit-reveal grid w-full gap-4 overflow-hidden p-4 [--delay:0] lg:grid-cols-[1.15fr_0.85fr] lg:p-6">
    <div class="orbit-card relative grid min-h-[300px] content-between gap-4 overflow-hidden p-6">
      <div class="orbit-marquee border-b border-slate-200 pb-3">
        <span>secure auth flow</span>
        <span>token refresh active</span>
        <span>credentials protected</span>
        <span>session controls ready</span>
      </div>
      <div>
        <p class="orbit-label">Operator login</p>
        <h1 class="mt-2 text-5xl font-semibold leading-[0.92] text-slate-900">Access your finance board.</h1>
        <p class="mt-3 max-w-md text-sm text-slate-600">
          Sign in to continue managing accounts, transactions, categories, and budgets.
        </p>
      </div>
    </div>
    <div class="orbit-card w-full p-6">
      <h2 class="text-2xl font-bold text-slate-900">Login</h2>
      <p class="mt-1 text-sm text-slate-600">Use your account credentials.</p>

      {#if data.alreadyAuthenticated}
        <div class="mt-4 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800">
          <p class="orbit-label">Session active</p>
          <p class="mt-1">Continue directly to your dashboard.</p>
        </div>
        <div class="mt-3">
          <a href="/"><Button>Open dashboard</Button></a>
        </div>
      {/if}

      {#if form?.message}
        <div class="mt-4 rounded-xl border border-red-300/70 bg-red-50/80 px-3 py-2 text-sm text-red-800">
          {String(form.message)}
        </div>
      {/if}

      <form
        class="mt-5 grid gap-4"
        method="POST"
        use:enhance={() => {
          return async ({ result, update }) => {
            if (result.type === "redirect") {
              toasts.success("Welcome back.");
              await goto(result.location);
              return;
            }
            if (result.type === "failure") {
              await update();
              toasts.error("Could not sign in.");
            }
          };
        }}
      >
        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          error={fieldErrors.email}
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          error={fieldErrors.password}
          required
        />
        <Button type="submit">Sign in</Button>
      </form>

      <p class="mt-4 text-sm text-slate-600">
        No account yet? <a class="font-medium text-slate-900 underline" href="/register">Create account</a>
      </p>
    </div>
  </section>
</main>

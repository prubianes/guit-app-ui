<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/Button.svelte";
  import FormField from "$lib/components/FormField.svelte";
  import { toasts } from "$lib/components/toastStore";

  let { form }: { form: Record<string, unknown> | null } = $props();
  const fieldErrors = $derived((form?.fieldErrors || {}) as Record<string, string>);
</script>

<main class="mx-auto grid min-h-screen w-full max-w-5xl place-items-center px-4 py-10">
  <section class="grid w-full gap-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[var(--shadow)] lg:grid-cols-[1.1fr_0.9fr]">
    <div class="grid content-end gap-4 rounded-[2rem] border border-slate-200 bg-white p-6">
      <p class="text-xs uppercase tracking-[0.22em] text-slate-500">The New More</p>
      <h1 class="text-5xl font-bold leading-[0.9] text-slate-900">Open your ledger.</h1>
      <p class="text-sm text-slate-600">
        Register a personal workspace to manage categories, budgets and transactions.
      </p>
    </div>
    <div class="w-full rounded-[2rem] border border-slate-200 bg-white p-6">
      <h2 class="text-2xl font-bold text-slate-900">Create account</h2>
      <p class="mt-1 text-sm text-slate-600">Start tracking accounts, categories, budgets, and transactions.</p>

      {#if form?.message}
        <div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(form.message)}
        </div>
      {/if}

      <form
        class="mt-5 grid gap-4"
        method="POST"
        use:enhance={() => {
          return async ({ result, update }) => {
            if (result.type === "success") {
              toasts.success("Account created successfully.");
              await goto("/");
              return;
            }
            if (result.type === "failure") {
              await update();
              toasts.error("Could not create account.");
            }
          };
        }}
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField
            label="First name"
            name="firstName"
            placeholder="Pablo"
            error={fieldErrors.firstName}
            required
          />
          <FormField
            label="Last name"
            name="lastName"
            placeholder="Rubianes"
            error={fieldErrors.lastName}
            required
          />
        </div>
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
          placeholder="At least 8 characters"
          error={fieldErrors.password}
          required
        />
        <Button type="submit">Create account</Button>
      </form>

      <p class="mt-4 text-sm text-slate-600">
        Already registered? <a class="font-medium text-slate-900 underline" href="/login">Sign in</a>
      </p>
    </div>
  </section>
</main>

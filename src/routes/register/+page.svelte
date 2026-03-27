<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/Button.svelte";
  import FormField from "$lib/components/FormField.svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import { toasts } from "$lib/components/toastStore";

  let { form }: { form: Record<string, unknown> | null } = $props();
  const fieldErrors = $derived((form?.fieldErrors || {}) as Record<string, string>);
</script>

<main class="orbit-shell grid min-h-screen place-items-center py-8">
  <ThemeToggle class="fixed right-4 top-4 z-20" />
  <section class="orbit-frame orbit-reveal grid w-full max-w-5xl gap-4 overflow-hidden p-4 [--delay:0] lg:grid-cols-[1.15fr_0.85fr] lg:p-6">
    <div class="orbit-card relative grid min-h-[320px] content-between gap-4 overflow-hidden p-6">
      <div class="orbit-marquee border-b border-slate-200 pb-3">
        <span>new account setup</span>
        <span>secure token cookies</span>
        <span>private finance workspace</span>
        <span>ready in seconds</span>
      </div>
      <div>
        <p class="orbit-label">Register</p>
        <h1 class="mt-2 text-5xl font-semibold leading-[0.92] text-slate-900">Start your finance board.</h1>
        <p class="mt-3 max-w-md text-sm text-slate-600">
          Create an account and begin tracking accounts, categories, budgets, and transactions.
        </p>
      </div>
    </div>
    <div class="orbit-card w-full p-6">
      <h2 class="text-2xl font-bold text-slate-900">Create account</h2>
      <p class="mt-1 text-sm text-slate-600">Enter your details to create a workspace.</p>

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
              toasts.success("Account created successfully.");
              await goto(result.location);
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
            placeholder="Your first name"
            error={fieldErrors.firstName}
          />
          <FormField
            label="Last name"
            name="lastName"
            placeholder="Your last name"
            error={fieldErrors.lastName}
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

<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/Button.svelte";
</script>

<main class="mx-auto grid min-h-screen w-full max-w-xl place-items-center px-6">
  <section class="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <p class="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
      {$page.status === 404 ? "Not found" : "Unexpected error"}
    </p>
    <h1 class="mt-2 text-3xl font-bold text-slate-900">
      {$page.status === 404 ? "Page does not exist" : "Something went wrong"}
    </h1>
    <p class="mt-3 text-sm text-slate-600">
      {$page.error?.message || "Please try again in a few moments."}
    </p>
    <div class="mt-6 flex gap-2">
      <a href="/"><Button variant="secondary">Go home</Button></a>
      <a href="/login"><Button variant="ghost">Login</Button></a>
    </div>
  </section>
</main>

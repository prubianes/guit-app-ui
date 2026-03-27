<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/Button.svelte";
</script>

<main class="orbit-shell grid min-h-screen place-items-center">
  <section class="orbit-frame w-full max-w-2xl p-8 sm:p-10">
    <div class="orbit-marquee border-b border-slate-200 pb-3">
      <span>route not available</span>
      <span>recover navigation</span>
      <span>return to control panel</span>
      <span>session safe</span>
    </div>
    <p class="mt-5 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
      {$page.status === 404 ? "Not found" : "Unexpected error"}
    </p>
    <h1 class="mt-2 text-3xl font-bold text-slate-900">
      {$page.status === 404 ? "Page does not exist" : "Something went wrong"}
    </h1>
    <p class="mt-3 text-sm text-slate-600">
      {$page.error?.message || "Please try again in a few moments."}
    </p>
    <div class="mt-6 flex gap-2">
      <a href="/"><Button variant="secondary">Back to dashboard</Button></a>
      <a href="/login"><Button variant="ghost">Login</Button></a>
    </div>
  </section>
</main>

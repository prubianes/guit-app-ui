<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";
  import Button from "$lib/components/Button.svelte";
  import StateMessage from "$lib/components/StateMessage.svelte";
  import { toasts } from "$lib/components/toastStore";

  let { data }: { data: PageData } = $props();
</script>

<main class="space-y-4">
  <section class="rounded-2xl border border-slate-200 bg-white p-4">
    <h1 class="text-2xl font-bold text-slate-900">Profile</h1>
    <p class="text-sm text-slate-600">Manage your account session and profile data.</p>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load profile" message={data.loadError} tone="error" />
  {:else if data.user}
    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <dl class="grid gap-3 text-sm text-slate-700">
        <div>
          <dt class="font-medium text-slate-500">Email</dt>
          <dd>{data.user.email}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Name</dt>
          <dd>{data.user.firstName || "-"} {data.user.lastName || ""}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Member since</dt>
          <dd>{data.user.createdAt || "-"}</dd>
        </div>
      </dl>
      <div class="mt-5 flex gap-2">
        <form
          method="POST"
          action="?/refreshProfile"
          use:enhance={() => {
            return async ({ result }) => {
              if (result.type === "success") toasts.success("Profile refreshed.");
              else toasts.error("Could not refresh profile.");
            };
          }}
        >
          <Button type="submit" variant="secondary">Refresh profile</Button>
        </form>
        <form method="POST" action="?/logout">
          <Button type="submit" variant="danger">Logout</Button>
        </form>
      </div>
    </section>
  {/if}
</main>

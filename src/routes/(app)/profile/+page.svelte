<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";
  import Button from "$lib/components/Button.svelte";
  import StateMessage from "$lib/components/StateMessage.svelte";
  import { toasts } from "$lib/components/toastStore";

  let { data }: { data: PageData } = $props();
</script>

<main class="space-y-3">
  <section class="orbit-frame p-4">
    <h1 class="text-2xl font-bold text-slate-900">Profile</h1>
    <p class="text-sm text-slate-600">Account identity and session controls.</p>
  </section>

  {#if data.loadError}
    <StateMessage title="Could not load profile" message={data.loadError} tone="error" />
  {:else if data.user}
    <section class="orbit-card p-5">
      <dl class="grid gap-3 text-sm text-slate-700">
        <div>
          <dt class="orbit-label">Email</dt>
          <dd>{data.user.email}</dd>
        </div>
        <div>
          <dt class="orbit-label">Name</dt>
          <dd>{data.user.firstName || "-"} {data.user.lastName || ""}</dd>
        </div>
        <div>
          <dt class="orbit-label">Member since</dt>
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

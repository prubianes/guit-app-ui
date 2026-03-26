<script lang="ts">
  import { navigating } from "$app/stores";
  import { onMount } from "svelte";
  import "../app.css";
  import LoadingBar from "$lib/components/LoadingBar.svelte";
  import ToastHost from "$lib/components/ToastHost.svelte";

  onMount(() => {
    requestAnimationFrame(() => {
      document.body.classList.add("is-ready");
    });
  });
</script>

<LoadingBar visible={Boolean($navigating)} />
<ToastHost />
<slot />

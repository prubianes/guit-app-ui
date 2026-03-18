<script lang="ts">
  import { navigating } from "$app/stores";
  import "../app.css";
  import LoadingBar from "$lib/components/LoadingBar.svelte";
  import ToastHost from "$lib/components/ToastHost.svelte";
</script>

<LoadingBar visible={Boolean($navigating)} />
<ToastHost />
<slot />

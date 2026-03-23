<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/Button.svelte";

  let { class: className = "" }: { class?: string } = $props();

  let theme = $state("light");

  const applyTheme = (next: "light" | "dark") => {
    theme = next;
    document.body.dataset.theme = next;
    localStorage.setItem("finance-theme", next);
  };

  const toggleTheme = () => {
    applyTheme(theme === "light" ? "dark" : "light");
  };

  onMount(() => {
    const storedTheme = localStorage.getItem("finance-theme");
    applyTheme(storedTheme === "dark" ? "dark" : "light");
  });
</script>

<div class={className}>
  <Button variant="ghost" on:click={toggleTheme}>Theme: {theme}</Button>
</div>

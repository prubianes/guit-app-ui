<script lang="ts">
  let { visible = false }: { visible: boolean } = $props();
</script>

{#if visible}
  <div class="fixed left-0 right-0 top-0 z-[60] h-1 overflow-hidden bg-slate-200">
    <div class="h-full w-1/3 animate-[loading_1s_infinite] bg-slate-900"></div>
  </div>
{/if}

<style>
  @keyframes loading {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(320%);
    }
  }
</style>

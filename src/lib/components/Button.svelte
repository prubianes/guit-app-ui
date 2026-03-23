<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher<{ click: MouseEvent }>();

  let {
    type = "button",
    variant = "primary",
    class: className = "",
    disabled = false,
    children
  }: {
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary" | "danger" | "ghost";
    class?: string;
    disabled?: boolean;
    children?: import("svelte").Snippet;
  } = $props();

  const variants = {
    primary: "border border-transparent",
    secondary: "border",
    danger: "border border-transparent",
    ghost: "border bg-transparent"
  };
</script>

<button
  {type}
  {disabled}
  onclick={(event) => dispatch("click", event)}
  class={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[
    variant
  ]} ${className} btn-${variant}`}
>
  {@render children?.()}
</button>

<style>
  .btn-primary {
    background: var(--text);
    color: var(--bg);
  }

  .btn-primary:hover {
    filter: brightness(1.08);
  }

  .btn-secondary {
    background: var(--surface-strong);
    color: var(--text);
    border-color: var(--line);
  }

  .btn-secondary:hover {
    background: var(--surface);
  }

  .btn-danger {
    background: var(--danger);
    color: #fff;
  }

  .btn-danger:hover {
    filter: brightness(1.08);
  }

  .btn-ghost {
    border-color: var(--line);
    color: var(--text);
    background: transparent;
  }

  .btn-ghost:hover {
    background: var(--surface-strong);
  }
</style>

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
    primary: "border border-transparent btn-primary",
    secondary: "border btn-secondary",
    danger: "border border-transparent btn-danger",
    ghost: "border bg-transparent btn-ghost"
  };
</script>

<button
  {type}
  {disabled}
  onclick={(event) => dispatch("click", event)}
  class={`inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[
    variant
  ]} ${className}`}
>
  {@render children?.()}
</button>

<style>
  .btn-primary {
    background: var(--text) !important;
    color: var(--bg) !important;
    box-shadow: var(--shadow-sm);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
  }

  .btn-secondary {
    background: var(--surface-strong) !important;
    color: var(--text) !important;
    border-color: var(--line) !important;
  }

  .btn-secondary:hover {
    background: var(--surface) !important;
    transform: translateY(-2px);
  }

  .btn-danger {
    background: var(--danger) !important;
    color: #fff !important;
  }

  .btn-danger:hover {
    transform: translateY(-2px);
  }

  .btn-ghost {
    border-color: var(--line) !important;
    color: var(--text) !important;
    background: transparent !important;
  }

  .btn-ghost:hover {
    background: var(--surface-strong) !important;
    transform: translateY(-2px);
  }

  button:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 24%, transparent);
  }
</style>

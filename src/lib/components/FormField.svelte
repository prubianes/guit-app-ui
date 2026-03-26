<script lang="ts">
  let {
    label,
    name,
    type = "text",
    value = "",
    placeholder = "",
    error,
    required = false
  }: {
    label: string;
    name: string;
    type?: string;
    value?: string | number;
    placeholder?: string;
    error?: string;
    required?: boolean;
  } = $props();
</script>

<label class="grid gap-1.5">
  <span class="text-sm font-medium text-slate-700">{label}</span>
  <input
    {name}
    {type}
    {placeholder}
    value={value}
    {required}
    aria-invalid={Boolean(error)}
    class="orbit-input text-sm"
  />
  {#if error}
    <span class="text-xs text-red-600">{error}</span>
  {/if}
</label>

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
    class={`w-full rounded-lg border px-3 py-2 text-sm ${
      error ? "border-red-500" : "border-slate-300"
    } bg-white`}
  />
  {#if error}
    <span class="text-xs text-red-600">{error}</span>
  {/if}
</label>

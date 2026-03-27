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

  const fieldId = $derived(`field-${name}`);
  const errorId = $derived(`${fieldId}-error`);
</script>

<label class="grid gap-1.5">
  <span class="text-sm font-medium text-slate-700" id={`${fieldId}-label`}>{label}</span>
  <input
    id={fieldId}
    {name}
    {type}
    {placeholder}
    value={value}
    {required}
    aria-invalid={Boolean(error)}
    aria-describedby={error ? errorId : undefined}
    class="orbit-input text-sm"
  />
  {#if error}
    <span id={errorId} class="text-xs text-red-600">{error}</span>
  {/if}
</label>

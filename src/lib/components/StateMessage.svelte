<script lang="ts">
  let {
    title,
    message,
    tone = "neutral"
  }: {
    title: string;
    message: string;
    tone?: "neutral" | "error";
  } = $props();
</script>

<section
  class={`rounded-xl border p-6 ${
    tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-800"
  }`}
>
  <h3 class="text-base font-semibold">{title}</h3>
  <p class="mt-1 text-sm opacity-90">{message}</p>
</section>

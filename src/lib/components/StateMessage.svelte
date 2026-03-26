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
  class={`orbit-card p-6 ${
    tone === "error" ? "border-red-300/60 bg-red-50/70 text-red-900" : "text-slate-800"
  }`}
>
  <p class="orbit-label">{tone === "error" ? "Issue" : "Info"}</p>
  <h3 class="mt-1 text-lg font-semibold">{title}</h3>
  <p class="mt-1 text-sm opacity-90">{message}</p>
</section>

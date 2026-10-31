<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { TooltipProvider, themeManager } from '@immich/ui';
  import { fitTooltips } from '$lib/tooltip-fit.js';
  import { u } from '$lib/paths.js';
  let { children } = $props();

  // The theme manager only touches the DOM on toggle/system change; sync once so the
  // stored preference (default: follow the browser) is applied on load.
  onMount(() => {
    // The service worker receives files shared into the installed app (see frontend/sw.js)
    navigator.serviceWorker?.register(u('/sw.js'), { scope: u('/') }).catch(() => {});
    themeManager.setPreference(themeManager.preference);
    return fitTooltips();
  });
</script>

<TooltipProvider>
  {@render children()}
</TooltipProvider>

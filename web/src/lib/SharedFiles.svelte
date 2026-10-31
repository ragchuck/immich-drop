<script>
  import { onMount } from 'svelte';
  import { Card, CardBody, CardHeader, CardTitle } from '@immich/ui';
  import { t } from './i18n.svelte.js';
  import { u } from './paths.js';
  import Uploader from './Uploader.svelte';

  // Files shared into the installed app: the service worker (frontend/sw.js) parks them in the Cache and opens
  // "/?shared-files=N". They are uploaded to your own library with the normal uploader.
  let files = $state([]);

  onMount(async () => {
    const q = new URLSearchParams(location.search);
    if (!q.has('shared-files') || !('caches' in window)) return;
    try {
      const cache = await caches.open('immich-drop-share');
      const found = [];
      for (const req of await cache.keys()) {
        const res = await cache.match(req);
        await cache.delete(req);
        if (!res) continue;
        const type = res.headers.get('Content-Type') || '';
        const last = Number(res.headers.get('X-Last-Modified')) || Date.now();
        const name = decodeURIComponent(res.headers.get('X-Name') || '') || `shared_${found.length + 1}`;
        found.push(new File([await res.blob()], name, { type, lastModified: last }));
      }
      files = found;
    } catch (e) {
      console.warn('Could not read the shared files:', e);
    }
    q.delete('shared-files');
    const rest = q.toString();
    history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '')); // a reload must not upload again
  });
</script>

{#if files.length}
  <Card>
    <CardHeader><CardTitle>{t('home.shared.title')}</CardTitle></CardHeader>
    <CardBody><Uploader initialFiles={files} /></CardBody>
  </Card>
{/if}

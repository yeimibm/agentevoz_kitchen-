<script lang="ts">
  import { Header, Controls, PipelineCard, ActivityFeed, Console } from './lib/components';
  import Kitchen from './lib/components/Kitchen.svelte';
  import { createVoiceSession } from './lib/websocket';

  const voiceSession = createVoiceSession();
  const isKitchenRoute = window.location.pathname === '/kitchen';
</script>

{#if isKitchenRoute}
  <Kitchen />
{:else}
  <div class="max-w-3xl mx-auto">
    <Header />
    <Controls onStart={() => voiceSession.start()} onStop={() => voiceSession.stop()} />
    <PipelineCard />
    <ActivityFeed />
    <Console />
  </div>
{/if}


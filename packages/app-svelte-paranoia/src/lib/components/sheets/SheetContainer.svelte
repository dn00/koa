<script lang="ts">
  import { activeSheet } from '$lib/stores/ui';
  import ActSheet from './ActSheet.svelte';
  import VerifySheet from './VerifySheet.svelte';
  import CurateSheet from './CurateSheet.svelte';
  import CrewSheet from './CrewSheet.svelte';

  function close() {
    activeSheet.set(null);
  }
</script>

{#if $activeSheet}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="backdrop" on:click={close}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
      class="sheet" 
      on:click|stopPropagation 
    >
      <div class="handle"></div>
      
      {#if $activeSheet === 'ACT'}
        <ActSheet />
      {:else if $activeSheet === 'VERIFY'}
        <VerifySheet />
      {:else if $activeSheet === 'CURATE'}
        <CurateSheet />
      {:else if $activeSheet === 'CREW'}
        <CrewSheet />
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: absolute; /* Relative to TerminalFeed */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 5, 0, 0.85); /* Darker dim */
    z-index: 100;
    display: flex;
    align-items: center; /* Center Vertically */
    justify-content: center; /* Center Horizontally */
    padding: var(--spacing-md);
  }

  .sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    /* Replaced solid black with theme charcoal-green */
    background: rgba(15, 20, 15, 0.98); 
    border-top: 2px solid var(--color-phosphor);
    z-index: 100;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -4px 20px rgba(0, 50, 0, 0.5); /* Ambient glow */
    max-height: 90%;
    position: relative;
  }

  /* TUI Header Bar */
  .handle {
    display: none; /* No handle in TUI */
  }
  
  /* Optional: Could add a fake title bar here if needed via slot/prop, 
     but for now just the border is enough */
</style>

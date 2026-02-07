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

{#if $activeSheet === 'CREW'}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="backdrop" on:click={close}>
    <div class="sheet" on:click|stopPropagation>
      <CrewSheet />
    </div>
  </div>
{:else if $activeSheet === 'ACT'}
  <div class="backdrop" on:click={close}>
    <div class="sheet" on:click|stopPropagation><ActSheet /></div>
  </div>
{:else if $activeSheet === 'VERIFY'}
  <div class="backdrop" on:click={close}>
    <div class="sheet" on:click|stopPropagation><VerifySheet /></div>
  </div>
{:else if $activeSheet === 'CURATE'}
  <div class="backdrop" on:click={close}>
    <div class="sheet" on:click|stopPropagation><CurateSheet /></div>
  </div>
{/if}

<style>
  .backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 5, 0, 0.85);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
  }

  .sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: rgba(15, 20, 15, 0.98);
    border-top: 2px solid var(--color-phosphor);
    z-index: 100;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -4px 20px rgba(0, 50, 0, 0.5);
    max-height: 90%;
    position: relative;
  }
</style>

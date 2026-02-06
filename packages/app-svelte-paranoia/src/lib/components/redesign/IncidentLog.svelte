<script lang="ts">
  import { threats } from '$lib/stores/game';
  import { activeSheet, focusRoomId } from '$lib/stores/ui';

  function selectThreat(room: string) {
    focusRoomId.set(room);
    // Auto-open ACT sheet for immediate response
    activeSheet.set('ACT');
  }
</script>

<div class="incident-log">
  {#if $threats.length === 0}
    <div class="empty">> ALL_SYSTEMS_NOMINAL</div>
  {/if}

  {#each $threats as threat}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
      class="log-entry" 
      class:selected={$focusRoomId === threat.room}
      on:click={() => selectThreat(threat.room)}
    >
      <div class="header">
        <span class="blink text-alert">> {threat.type}_DETECTED</span>
        <span class="severity">[{threat.severity}]</span>
      </div>
      <div class="location">LOC: {threat.room.toUpperCase()}</div>
      <div class="status">CONFIDENCE: {threat.confidence}</div>
    </div>
  {/each}
</div>

<style>
  .incident-log {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .empty {
    color: var(--color-phosphor-dim);
    font-size: 14px;
  }

  .log-entry {
    border: 1px solid var(--color-phosphor-dim);
    padding: 8px;
    font-size: 14px;
    cursor: pointer;
  }

  .log-entry:hover {
    background: rgba(51, 255, 51, 0.1);
    border-color: var(--color-phosphor);
  }

  .log-entry.selected {
    background: var(--color-phosphor);
    color: #000;
    border-color: var(--color-phosphor);
    box-shadow: 0 0 10px rgba(51, 255, 51, 0.4);
  }

  /* When selected, invert children colors implies specificity */
  .log-entry.selected .text-alert {
    color: #000;
    animation: none; /* Stop blinking when handled/selected */
  }

  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-weight: bold;
  }

  .text-alert {
    color: var(--color-alert);
  }

  .location {
    padding-left: 12px;
  }

  .status {
    padding-left: 12px;
    color: var(--color-phosphor-dim);
  }
  
  .log-entry.selected .status {
    color: rgba(0,0,0,0.7);
  }
</style>

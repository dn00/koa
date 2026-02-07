<script lang="ts">
  import { focusRoomId } from '$lib/stores/ui';
  import { dispatch } from '$lib/stores/game';
  import { Lock, Wind, Users } from 'lucide-svelte';
  import StationMap from '../StationMap.svelte';

  function handleVent() {
    if (!$focusRoomId) return;
    dispatch({ type: 'VENT', place: $focusRoomId });
  }

  function handleLock() {
    // TODO: Need door selection. For now, just logging.
    console.log('Locking requires specific door selection logic');
  }

  function handleDispatchCrew() {
    if (!$focusRoomId) return;
    // MVP: Dispatch 'rook' to the location
    dispatch({ type: 'ORDER', target: 'rook', intent: 'move', place: $focusRoomId });
  }
</script>

<div class="sheet-header">
  <h2>ACT</h2>
  <span class="focus-badge">{$focusRoomId ? `TARGET: ${$focusRoomId.toUpperCase()}` : 'NO TARGET'}</span>
</div>

  <!-- Map Selection Area -->
  <div class="map-selector">
    <div class="map-label">>> SELECT_TARGET_SECTOR</div>
    <div class="map-wrapper">
      <StationMap />
    </div>
  </div>

  <div class="actions-list">
    {#if $focusRoomId}
      <button class="action-item" on:click={handleDispatchCrew}>
        <div class="icon"><Users size={20} /></div>
        <div class="details">
          <span class="name">Dispatch Crew through <span class="highlight">{$focusRoomId}</span></span>
          <span class="sub">Rook (Sentry)</span>
        </div>
      </button>
      
      <button class="action-item" on:click={handleLock} disabled>
        <div class="icon"><Lock size={20} /></div>
        <div class="details">
          <span class="name">Lockdown <span class="highlight">{$focusRoomId}</span></span>
          <span class="sub">Seals all connected doors (Coming Soon)</span>
        </div>
      </button>
  
      <button class="action-item danger" on:click={handleVent}>
        <div class="icon"><Wind size={20} /></div>
        <div class="details">
          <span class="name">Vent Atmosphere: <span class="highlight-danger">{$focusRoomId}</span></span>
          <span class="sub text-danger">Hazard: Lethal</span>
        </div>
      </button>
    {:else}
      <div class="empty-state">
        >> NO_TARGET_SELECTED.
        <br/>
        >> SELECT_SECTOR_ON_MAP.
      </div>
    {/if}
  </div>

<style>
  .sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--color-phosphor-dim);
    padding-bottom: 8px;
  }
  
  h2 {
    font-family: var(--font-display);
    color: var(--color-phosphor);
  }
  
  .focus-badge {
    background: transparent;
    padding: 2px 8px;
    font-size: 14px;
    font-family: var(--font-mono);
    color: var(--color-phosphor);
    border: 1px solid var(--color-phosphor-dim);
  }

  .actions-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
  }

  .action-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: transparent;
    border: 1px solid var(--color-phosphor-dim);
    padding: 8px;
    border-radius: 0; /* TUI = Sharp */
    text-align: left;
    transition: all 0.1s;
    cursor: pointer;
  }

  .action-item:hover {
    background: var(--color-phosphor);
    color: #000;
    border-color: var(--color-phosphor);
  }
  
  /* Hover affects children too */
  .action-item:hover .name,
  .action-item:hover .sub,
  .action-item:hover .icon {
    color: #000;
  }

  .action-item:active {
    transform: translateY(1px);
  }

  .action-item.danger {
    border-color: var(--color-warning-dim);
    color: var(--color-warning); /* Force text to warning color */
  }
  
  .action-item.danger .name,
  .action-item.danger .sub,
  .action-item.danger .icon {
    color: var(--color-warning); /* Ensure children inherit */
  }
  
  .action-item.danger:hover {
    background: var(--color-warning);
    color: #000;
  }
  
  .icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-phosphor);
  }

  .details {
    display: flex;
    flex-direction: column;
  }

  .name {
    font-weight: bold;
    font-size: 14px;
    font-family: var(--font-mono);
    color: var(--color-phosphor);
  }

  /* Dynamic Target Highlight */
  :global(.highlight) {
    color: #ffffff; /* Pure white for emphasis */
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.6);
  }
  
  :global(.highlight-danger) {
    color: #ffffff;
    text-shadow: 0 0 5px var(--color-warning);
    font-weight: 900;
  }

  .sub {
    font-size: 12px;
    color: var(--color-phosphor); /* Brighter */
    opacity: 0.8;
    font-family: var(--font-mono);
  }
  
  .map-selector {
    margin-bottom: 16px;
    border: 1px solid var(--color-phosphor-dim);
    background: #000;
  }
  
  .map-label {
    background: var(--color-phosphor-dim);
    color: #000;
    font-size: 11px;
    font-weight: bold;
    padding: 2px 4px;
    font-family: var(--font-mono);
  }

  .map-wrapper {
    height: 200px; /* Mini-map height */
    width: 100%;
  }

  .empty-state {
    color: var(--color-phosphor-dim);
    font-family: var(--font-mono);
    text-align: center;
    padding: 20px;
    border: 1px dashed var(--color-phosphor-dim);
  }
</style>

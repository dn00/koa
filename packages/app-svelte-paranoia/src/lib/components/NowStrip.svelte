<script lang="ts">
  import { threats } from '$lib/stores/game';
  import { focusRoomId } from '$lib/stores/ui';
  import { Flame, Wind, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-svelte';

  function focusThreat(room: string) {
    focusRoomId.set(room);
  }

  function getIcon(type: string) {
    switch (type) {
      case 'FIRE': return Flame;
      case 'O2': return Wind;
      default: return AlertTriangle;
    }
  }

  function getConfidenceIcon(confidence: string) {
    switch (confidence) {
      case 'CONFIRMED': return CheckCircle;
      case 'UNCERTAIN': return AlertTriangle;
      default: return HelpCircle;
    }
  }
</script>

<div class="now-strip">
  {#each $threats as threat}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div 
      class="threat-card" 
      class:focused={$focusRoomId === threat.room}
      on:click={() => focusThreat(threat.room)}
      role="button"
      tabindex="0"
    >
      <div class="threat-icon {threat.severity.toLowerCase()}">
        <svelte:component this={getIcon(threat.type)} size={16} />
      </div>

      <div class="info">
        <div class="header">
          <span class="type">{threat.type}</span>
          <span class="room">{threat.room}</span>
        </div>
        <div class="confidence" class:confirmed={threat.confidence === 'CONFIRMED'}>
          <svelte:component this={getConfidenceIcon(threat.confidence)} size={10} />
          <span>{threat.confidence}</span>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .now-strip {
    display: flex;
    overflow-x: auto;
    padding: var(--spacing-sm) var(--spacing-md);
    gap: var(--spacing-sm);
    flex-shrink: 0;
    scrollbar-width: none; /* Hide scrollbar */
  }

  .threat-card {
    background: var(--color-bg-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 160px;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .threat-card.focused {
    border-color: var(--color-primary);
    background: rgba(0, 240, 255, 0.05);
  }

  .threat-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
  }
  .threat-icon.high { color: var(--color-danger); border: 1px solid var(--color-danger); }
  .threat-icon.med { color: var(--color-warning); border: 1px solid var(--color-warning); }

  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
  }
  
  .room {
    color: var(--color-text-dim);
    font-size: 11px;
  }

  .confidence {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-text-dim);
  }
  .confidence.confirmed { color: var(--color-success); }
</style>

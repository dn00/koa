<script lang="ts">
  import { focusRoomId } from '$lib/stores/ui';
  import { dispatch, crew, phase } from '$lib/stores/game';
  import StationMap from '../StationMap.svelte';
  import { getDoorsForRoom, REROUTE_TARGETS, ORDER_INTENTS, RATION_LEVELS } from '$lib/data/command-helpers';
  import type { RerouteTarget, OrderIntent, RationLevel } from '$lib/data/command-helpers';
  import type { Command } from '@aura/project-paranoia';

  let selectedCrewId: string | null = null;
  let selectedIntent: OrderIntent = 'move';
  let selectedReroute: RerouteTarget | null = null;
  let selectedRation: RationLevel | null = null;
  let showStationWide = false;

  $: doors = $focusRoomId ? getDoorsForRoom($focusRoomId) : [];
  $: aliveCrew = $crew.filter(c => c.alive !== false);
  $: if (!selectedCrewId || !aliveCrew.some((c) => c.id === selectedCrewId)) {
    selectedCrewId = aliveCrew[0]?.id ?? null;
  }

  function handleScan() {
    if (!$focusRoomId) return;
    dispatch({ type: 'SCAN', place: $focusRoomId } as Command);
  }

  function handleListen() {
    if (!$focusRoomId) return;
    dispatch({ type: 'LISTEN', place: $focusRoomId } as Command);
  }

  function handleSeal() {
    if (!$focusRoomId) return;
    dispatch({ type: 'SEAL', place: $focusRoomId } as Command);
  }

  function handleVent() {
    if (!$focusRoomId) return;
    dispatch({ type: 'VENT', place: $focusRoomId } as Command);
  }

  function handleLock(doorId: string) {
    dispatch({ type: 'LOCK', doorId });
  }

  function handleUnlock(doorId: string) {
    dispatch({ type: 'UNLOCK', doorId });
  }

  function handleOrder() {
    if (!selectedCrewId) return;
    const cmd: any = { type: 'ORDER', target: selectedCrewId, intent: selectedIntent };
    if (selectedIntent === 'move' && $focusRoomId) cmd.place = $focusRoomId;
    dispatch(cmd);
  }

  function handlePurgeAir() {
    dispatch({ type: 'PURGE_AIR' });
  }

  function handleReroute() {
    if (!selectedReroute) return;
    dispatch({ type: 'REROUTE', target: selectedReroute });
  }

  function handleRations() {
    if (!selectedRation) return;
    dispatch({ type: 'RATIONS', level: selectedRation } as Command);
  }
</script>

<div class="sheet-header">
  <h2>ACT</h2>
  <span class="focus-badge">{$focusRoomId ? `TARGET: ${$focusRoomId.toUpperCase()}` : 'NO TARGET'}</span>
</div>

<div class="map-selector">
  <div class="map-label">>> SELECT_TARGET_SECTOR</div>
  <div class="map-wrapper">
    <StationMap />
  </div>
</div>

<div class="actions-list">
  <!-- ROOM ACTIONS -->
  {#if $focusRoomId}
    <div class="section-label">>> ROOM_ACTIONS</div>

    <button class="action-item" on:click={handleScan}>
      <div class="details">
        <span class="name">SCAN <span class="highlight">{$focusRoomId}</span></span>
        <span class="sub">Free. Reads room sensors</span>
      </div>
    </button>

    <button class="action-item" on:click={handleListen}>
      <div class="details">
        <span class="name">LISTEN <span class="highlight">{$focusRoomId}</span></span>
        <span class="sub">Free. Intercepts recent whispers</span>
      </div>
    </button>

    <button class="action-item" on:click={handleSeal}>
      <div class="details">
        <span class="name">SEAL <span class="highlight">{$focusRoomId}</span></span>
        <span class="sub">Restores atmosphere after venting</span>
      </div>
    </button>

    <button class="action-item danger" on:click={handleVent}>
      <div class="details">
        <span class="name">VENT <span class="highlight-danger">{$focusRoomId}</span></span>
        <span class="sub text-danger">Lethal. Creates doubts for crew in room</span>
      </div>
    </button>

    <!-- DOOR CONTROLS -->
    {#if doors.length > 0}
      <div class="section-label">>> DOOR_CONTROLS</div>
      {#each doors as door}
        <div class="door-row">
          <span class="door-label">{door.otherRoom}</span>
          <button class="inline-btn" on:click={() => handleLock(door.doorId)}>LOCK</button>
          <button class="inline-btn" on:click={() => handleUnlock(door.doorId)}>UNLOCK</button>
        </div>
      {/each}
    {/if}
  {:else}
    <div class="empty-state">
      >> NO_TARGET_SELECTED.
      <br/>
      >> SELECT_SECTOR_ON_MAP.
    </div>
  {/if}

  <!-- CREW ORDERS -->
  <div class="section-label">>> CREW_ORDERS</div>

  <div class="picker-group">
    <span class="picker-label">CREW:</span>
    <div class="picker-buttons">
      {#each aliveCrew as c}
        <button
          class="picker-btn"
          class:active={selectedCrewId === c.id}
          on:click={() => selectedCrewId = c.id}
        >{c.name.split(' ').pop()}</button>
      {/each}
    </div>
  </div>

  <div class="picker-group">
    <span class="picker-label">INTENT:</span>
    <div class="picker-buttons">
      {#each ORDER_INTENTS as intent}
        <button
          class="picker-btn"
          class:active={selectedIntent === intent}
          on:click={() => selectedIntent = intent}
        >{intent.toUpperCase()}</button>
      {/each}
    </div>
  </div>

  <button
    class="action-item"
    on:click={handleOrder}
    disabled={!selectedCrewId}
  >
    <div class="details">
      <span class="name">ORDER {selectedCrewId ?? '???'} → {selectedIntent.toUpperCase()}{selectedIntent === 'move' && $focusRoomId ? ` @ ${$focusRoomId}` : ''}</span>
      <span class="sub">Trust-gated. May be refused</span>
    </div>
  </button>

  <button class="section-toggle" on:click={() => (showStationWide = !showStationWide)}>
    >> STATION_WIDE {showStationWide ? '[-]' : '[+]'}
  </button>

  {#if showStationWide}
    <button class="action-item danger" on:click={handlePurgeAir}>
      <div class="details">
        <span class="name">PURGE_AIR</span>
        <span class="sub text-danger">10 power. +O2 all rooms. Doubt for ALL crew</span>
      </div>
    </button>

    <div class="picker-group">
      <span class="picker-label">REROUTE:</span>
      <div class="picker-buttons">
        {#each REROUTE_TARGETS as target}
          <button
            class="picker-btn"
            class:active={selectedReroute === target}
            on:click={() => selectedReroute = target}
          >{target.toUpperCase()}</button>
        {/each}
      </div>
    </div>

    <button
      class="action-item"
      on:click={handleReroute}
      disabled={!selectedReroute}
    >
      <div class="details">
        <span class="name">REROUTE → {selectedReroute?.toUpperCase() ?? '???'}</span>
        <span class="sub">5-15 power. Redirects system resources</span>
      </div>
    </button>

    {#if $phase === 'pre_shift'}
      <div class="picker-group">
        <span class="picker-label">RATIONS:</span>
        <div class="picker-buttons">
          {#each RATION_LEVELS as level}
            <button
              class="picker-btn"
              class:active={selectedRation === level}
              on:click={() => selectedRation = level}
            >{level.toUpperCase()}</button>
          {/each}
        </div>
      </div>

      <button
        class="action-item"
        on:click={handleRations}
        disabled={!selectedRation}
      >
        <div class="details">
          <span class="name">RATIONS → {selectedRation?.toUpperCase() ?? '???'}</span>
          <span class="sub">Pre-shift only. Affects morale & stress</span>
        </div>
      </button>
    {/if}
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

  .section-label {
    font-size: 11px;
    font-weight: bold;
    color: var(--color-phosphor);
    background: rgba(0, 20, 0, 0.6);
    padding: 2px 4px;
    margin-top: 8px;
    font-family: var(--font-mono);
    border-left: 3px solid var(--color-phosphor);
  }

  .section-toggle {
    background: transparent;
    border: 1px solid var(--color-phosphor-dim);
    color: var(--color-phosphor);
    font-family: var(--font-mono);
    font-size: 11px;
    text-align: left;
    padding: 4px 8px;
    cursor: pointer;
  }

  .section-toggle:hover {
    border-color: var(--color-phosphor);
    background: rgba(0, 20, 0, 0.6);
  }

  .action-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: transparent;
    border: 1px solid var(--color-phosphor-dim);
    padding: 8px;
    border-radius: 0;
    text-align: left;
    transition: all 0.1s;
    cursor: pointer;
  }

  .action-item:hover:not(:disabled) {
    background: var(--color-phosphor);
    color: #000;
    border-color: var(--color-phosphor);
  }

  .action-item:hover:not(:disabled) .name,
  .action-item:hover:not(:disabled) .sub {
    color: #000;
  }

  .action-item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .action-item:active:not(:disabled) {
    transform: translateY(1px);
  }

  .action-item.danger {
    border-color: var(--color-warning-dim);
    color: var(--color-warning);
  }

  .action-item.danger .name,
  .action-item.danger .sub {
    color: var(--color-warning);
  }

  .action-item.danger:hover:not(:disabled) {
    background: var(--color-warning);
    color: #000;
  }

  .action-item.danger:hover:not(:disabled) .name,
  .action-item.danger:hover:not(:disabled) .sub {
    color: #000;
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

  :global(.highlight) {
    color: #ffffff;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.6);
  }

  :global(.highlight-danger) {
    color: #ffffff;
    text-shadow: 0 0 5px var(--color-warning);
    font-weight: 900;
  }

  .sub {
    font-size: 12px;
    color: var(--color-phosphor);
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
    height: 200px;
    width: 100%;
  }

  .empty-state {
    color: var(--color-phosphor-dim);
    font-family: var(--font-mono);
    text-align: center;
    padding: 20px;
    border: 1px dashed var(--color-phosphor-dim);
  }

  /* Door row */
  .door-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-family: var(--font-mono);
  }

  .door-label {
    flex: 1;
    font-size: 13px;
    color: var(--color-phosphor);
    text-transform: uppercase;
  }

  .inline-btn {
    background: transparent;
    border: 1px solid var(--color-phosphor-dim);
    color: var(--color-phosphor);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .inline-btn:hover {
    background: var(--color-phosphor);
    color: #000;
  }

  /* Picker groups */
  .picker-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .picker-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-phosphor);
    opacity: 0.8;
    min-width: 50px;
  }

  .picker-buttons {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .picker-btn {
    background: transparent;
    border: 1px solid var(--color-phosphor-dim);
    color: var(--color-phosphor);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .picker-btn:hover {
    border-color: var(--color-phosphor);
  }

  .picker-btn.active {
    background: var(--color-phosphor);
    color: #000;
    border-color: var(--color-phosphor);
  }
</style>

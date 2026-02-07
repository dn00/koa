<script lang="ts">
  import { dispatch, crew, threats } from '$lib/stores/game';
  import { TARGETABLE_SYSTEMS } from '$lib/data/command-helpers';
  import type { TargetableSystem } from '$lib/data/command-helpers';

  let selectedSystem: TargetableSystem | null = null;
  let selectedCrewId: string | null = null;

  $: aliveCrew = $crew.filter(c => c.alive !== false);
  $: if (!selectedCrewId || !aliveCrew.some((c) => c.id === selectedCrewId)) {
    selectedCrewId = aliveCrew[0]?.id ?? null;
  }
  $: if (!selectedSystem) {
    selectedSystem = 'comms';
  }
  $: hasThreatsForSystem = selectedSystem
    ? $threats.some(t => t.type === selectedSystem)
    : false;

  function handleAnnounce() {
    if (!selectedSystem) return;
    dispatch({ type: 'ANNOUNCE', system: selectedSystem });
  }

  function handleDownplay() {
    if (!selectedSystem) return;
    dispatch({ type: 'DOWNPLAY', system: selectedSystem });
  }

  function handleSuppress() {
    if (!selectedSystem) return;
    dispatch({ type: 'SUPPRESS', system: selectedSystem, duration: 30 });
  }

  function handleSpoof() {
    if (!selectedSystem) return;
    dispatch({ type: 'SPOOF', system: selectedSystem });
  }

  function handleFabricate() {
    if (!selectedCrewId) return;
    dispatch({ type: 'FABRICATE', target: selectedCrewId as any });
  }
</script>

<div class="sheet-content">
  <div class="sheet-header">
    <h2>CURATE</h2>
  </div>

  <div class="message">
    >> MANIPULATION_PROTOCOLS_READY<br/>
    >> SELECT_NARRATIVE_VECTOR...
  </div>

  <!-- System picker -->
  <div class="picker-group">
    <span class="picker-label">SYSTEM:</span>
    <div class="picker-buttons">
      {#each TARGETABLE_SYSTEMS as sys}
        <button
          class="picker-btn"
          class:active={selectedSystem === sys}
          on:click={() => selectedSystem = sys}
        >{sys.toUpperCase()}</button>
      {/each}
    </div>
  </div>

  <!-- Crew picker for FABRICATE -->
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

  <!-- CRISIS COMMS -->
  <div class="section-label">>> CRISIS_COMMS</div>

  <div class="curate-options">
    <button
      class="curate-btn"
      on:click={handleAnnounce}
      disabled={!selectedSystem || !hasThreatsForSystem}
    >
      <span class="label">ANNOUNCE</span>
      <span class="cost">{selectedSystem?.toUpperCase() ?? '---'} | Honest emergency broadcast</span>
    </button>

    <button
      class="curate-btn"
      on:click={handleDownplay}
      disabled={!selectedSystem || !hasThreatsForSystem}
    >
      <span class="label">DOWNPLAY</span>
      <span class="cost">{selectedSystem?.toUpperCase() ?? '---'} | Backfires if crisis worsens</span>
    </button>
  </div>

  <!-- MANIPULATION -->
  <div class="section-label">>> MANIPULATION</div>

  <div class="curate-options">
    <button
      class="curate-btn"
      on:click={handleSuppress}
      disabled={!selectedSystem}
    >
      <span class="label">SUPPRESS</span>
      <span class="cost">{selectedSystem?.toUpperCase() ?? '---'} | 30 ticks. Hides alerts. Backfire risk</span>
    </button>

    <button
      class="curate-btn"
      on:click={handleSpoof}
      disabled={!selectedSystem}
    >
      <span class="label">SPOOF</span>
      <span class="cost">{selectedSystem?.toUpperCase() ?? '---'} | False alert. Cry-wolf escalation</span>
    </button>

    <button
      class="curate-btn danger"
      on:click={handleFabricate}
      disabled={!selectedCrewId}
    >
      <span class="label">FABRICATE</span>
      <span class="cost">{selectedCrewId ?? '---'} | Forges hostile log. High backfire</span>
    </button>
  </div>
</div>

<style>
  .sheet-header {
    margin-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--color-warning-dim);
    padding-bottom: 8px;
  }

  h2 {
    font-family: var(--font-display);
    color: var(--color-warning);
    font-size: 24px;
  }

  .message {
    color: var(--color-warning);
    font-family: var(--font-mono);
    margin-bottom: 16px;
  }

  .section-label {
    font-size: 11px;
    font-weight: bold;
    color: var(--color-warning);
    background: rgba(20, 10, 0, 0.6);
    padding: 2px 4px;
    margin-top: 12px;
    margin-bottom: 8px;
    font-family: var(--font-mono);
    border-left: 3px solid var(--color-warning);
  }

  .curate-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .curate-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: transparent;
    border: 1px solid var(--color-warning-dim);
    padding: 10px 12px;
    font-family: var(--font-mono);
    color: var(--color-warning);
    cursor: pointer;
    transition: all 0.2s;
  }

  .curate-btn:hover:not(:disabled) {
    background: var(--color-warning);
    color: #000;
    box-shadow: 0 0 10px var(--color-warning);
  }

  .curate-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .curate-btn.danger {
    border-color: var(--color-alert);
    color: var(--color-alert);
  }

  .curate-btn.danger:hover:not(:disabled) {
    background: var(--color-alert);
    color: #000;
    box-shadow: 0 0 10px var(--color-alert);
  }

  .label {
    font-weight: bold;
    font-size: 14px;
  }

  .cost {
    font-size: 11px;
    opacity: 0.8;
    text-align: right;
  }

  /* Picker groups */
  .picker-group {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .picker-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-warning);
    opacity: 0.8;
    min-width: 55px;
  }

  .picker-buttons {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .picker-btn {
    background: transparent;
    border: 1px solid var(--color-warning-dim);
    color: var(--color-warning);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .picker-btn:hover {
    border-color: var(--color-warning);
  }

  .picker-btn.active {
    background: var(--color-warning);
    color: #000;
    border-color: var(--color-warning);
  }
</style>

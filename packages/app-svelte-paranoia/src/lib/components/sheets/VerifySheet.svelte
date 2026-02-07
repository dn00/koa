<script lang="ts">
  import { CheckCircle } from 'lucide-svelte';
  import { doubts, threats, dispatch } from '$lib/stores/game';

  let selectedAlertSystem: string | null = null;

  $: threatTypes = [...new Set($threats.map(t => t.type))];
  $: if (!threatTypes.length) {
    selectedAlertSystem = null;
  } else if (!selectedAlertSystem || !threatTypes.includes(selectedAlertSystem)) {
    selectedAlertSystem = threatTypes[0];
  }

  function handleVerify() {
    dispatch({ type: 'VERIFY' });
  }

  function handleAudit() {
    dispatch({ type: 'AUDIT' });
  }

  function handleAlert() {
    if (!selectedAlertSystem) return;
    dispatch({ type: 'ALERT', system: selectedAlertSystem });
  }
</script>

<div class="sheet-header">
  <h2>VERIFY</h2>
  <p class="subtitle">Resolve Doubts to lower Suspicion</p>
</div>

<div class="section-title">ACTIVE DOUBTS (High Priority)</div>

<div class="doubt-list">
  {#if $doubts.length === 0}
    <div class="empty-state">>> NO_ACTIVE_DOUBTS</div>
  {:else}
    {#each $doubts as doubt (doubt.id)}
      <div class="doubt-card">
        <div class="doubt-header">
          <span class="topic">{doubt.topic}</span>
          <span class="severity">SEVERITY {doubt.severity}</span>
        </div>
        <div class="doubt-meta">
          <span>ID: {doubt.id}</span>
        </div>
      </div>
    {/each}
  {/if}

  <div class="actions">
    <button class="resolve-btn" on:click={handleVerify} disabled={$doubts.length === 0}>
      <CheckCircle size={16} />
      <span>VERIFY — 12 power, 60-tick cooldown</span>
    </button>
  </div>
</div>

<!-- DIAGNOSTIC TOOLS -->
<div class="section-title">DIAGNOSTIC TOOLS</div>

<div class="actions">
  <button class="resolve-btn" on:click={handleAudit}>
    <span>AUDIT — Reveals recent tampering traces</span>
  </button>
</div>

<!-- ALERT -->
{#if threatTypes.length > 0}
  <div class="section-title">ALERT</div>

  <div class="picker-group">
    <span class="picker-label">SYSTEM:</span>
    <div class="picker-buttons">
      {#each threatTypes as sys}
        <button
          class="picker-btn"
          class:active={selectedAlertSystem === sys}
          on:click={() => selectedAlertSystem = sys}
        >{sys.toUpperCase()}</button>
      {/each}
    </div>
  </div>

  <div class="actions">
    <button
      class="resolve-btn"
      on:click={handleAlert}
      disabled={!selectedAlertSystem}
    >
      <span>ALERT {selectedAlertSystem?.toUpperCase() ?? '---'} — Come clean about situation</span>
    </button>
  </div>
{/if}

<style>
  .sheet-header {
    margin-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--color-phosphor-dim);
    padding-bottom: 8px;
  }

  h2 {
    font-family: var(--font-display);
    color: var(--color-phosphor);
    font-size: 42px;
    text-shadow: 0 0 8px rgba(77, 191, 77, 0.6);
    letter-spacing: 2px;
    margin-bottom: 4px;
  }

  .subtitle {
    font-size: 14px;
    color: var(--color-phosphor);
    opacity: 0.8;
    font-family: var(--font-mono);
  }

  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-phosphor);
    background: rgba(0, 20, 0, 0.6);
    padding: 4px 8px;
    margin: var(--spacing-md) 0 var(--spacing-sm);
    letter-spacing: 1px;
    border-left: 3px solid var(--color-phosphor);
    display: block;
  }

  .doubt-card {
    background: transparent;
    border: 1px solid var(--color-alert);
    padding: 12px;
    border-radius: 0;
    margin-bottom: 8px;
  }

  .doubt-header {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    margin-bottom: 4px;
    color: var(--color-alert);
  }

  .severity {
    color: #000;
    background: var(--color-alert);
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 0;
  }

  .doubt-meta {
    font-size: 11px;
    color: var(--color-phosphor-dim);
    margin-bottom: 12px;
    font-family: var(--font-mono);
  }

  .actions {
    margin-top: 8px;
  }

  .resolve-btn {
    width: 100%;
    background: transparent;
    color: var(--color-phosphor);
    padding: 10px;
    border: 1px solid var(--color-phosphor);
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
    font-size: 13px;
    font-family: var(--font-mono);
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }

  .resolve-btn:hover:not(:disabled) {
    background: var(--color-phosphor);
    color: #000;
    box-shadow: 0 0 10px var(--color-phosphor);
  }

  .resolve-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .empty-state {
    color: var(--color-phosphor-dim);
    font-family: var(--font-mono);
    text-align: center;
    padding: 16px;
    border: 1px dashed var(--color-phosphor-dim);
  }

  /* Picker groups */
  .picker-group {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .picker-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-phosphor);
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

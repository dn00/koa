<script lang="ts">
  import { targetCrewId } from '$lib/stores/ui';
  import { crew } from '$lib/stores/game';
  import { HeartPulse, Brain, Radio } from 'lucide-svelte';

  $: member = $crew.find(c => c.id === $targetCrewId);
</script>

<div class="sheet-content">
  {#if member}
    <div class="sheet-header">
      <h2>{member.name}</h2>
      <span class="role-badge">{member.role}</span>
    </div>

    <!-- Vitals -->
    <div class="section">
      <div class="section-title">>> BIOMETRIC_TELEMETRY</div>
      <div class="stat-row">
        <div class="stat-label"><HeartPulse size={16} /> BPM</div>
        <div class="stat-bar">
          <div class="bar-fill" style="width: 75%"></div>
        </div>
        <div class="stat-value">75</div>
      </div>
      <div class="stat-row">
        <div class="stat-label"><Brain size={16} /> STRESS</div>
        <div class="stat-bar">
          <div class="bar-fill warning" style="width: 45%"></div>
        </div>
        <div class="stat-value">45</div>
      </div>
    </div>

    <!-- Status -->
    <div class="section">
      <div class="section-title">>> CURRENT_STATUS</div>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">LOCATION</span>
          <span class="value">{member.room.toUpperCase()}</span>
        </div>
        <div class="status-item">
          <span class="label">ACTIVITY</span>
          <span class="value">{member.status.toUpperCase()}</span>
        </div>
      </div>
    </div>
    
    <!-- Audio Log -->
    <div class="section">
      <div class="section-title">>> AUDIO_TRANSCRIPT (LIVE)</div>
      <div class="transcript">
        <Radio size={14} class="blink" /> 
        <span class="text">"...reading unusual fluctuations in the thermal couplings..."</span>
      </div>
    </div>

  {:else}
    <div class="error">>> SIGNAL_LOST</div>
  {/if}
</div>

<style>
  .sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid var(--color-phosphor);
    padding-bottom: 8px;
    margin-bottom: 16px;
  }

  h2 {
    font-family: var(--font-display);
    color: var(--color-phosphor);
    font-size: 32px;
  }

  .role-badge {
    background: var(--color-phosphor);
    color: #000;
    font-weight: bold;
    padding: 2px 8px;
    font-family: var(--font-mono);
  }

  .section-title {
    font-size: 12px;
    color: var(--color-phosphor-dim);
    font-weight: bold;
    margin-bottom: 8px;
    border-bottom: 1px dashed var(--color-phosphor-dim);
    display: inline-block;
  }

  .section {
    margin-bottom: 24px;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    font-family: var(--font-mono);
  }

  .stat-label {
    width: 80px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--color-phosphor);
  }

  .stat-bar {
    flex: 1;
    height: 12px;
    background: rgba(0, 20, 0, 0.5);
    border: 1px solid var(--color-phosphor-dim);
  }

  .bar-fill {
    height: 100%;
    background: var(--color-phosphor);
  }
  
  .bar-fill.warning {
    background: var(--color-warning);
  }

  .stat-value {
    width: 30px;
    text-align: right;
    font-weight: bold;
  }

  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .status-item {
    border: 1px solid var(--color-phosphor-dim);
    padding: 8px;
    display: flex;
    flex-direction: column;
  }

  .status-item .label {
    font-size: 10px;
    color: var(--color-phosphor-dim);
  }

  .status-item .value {
    font-size: 14px;
    font-weight: bold;
    color: var(--color-phosphor);
  }

  .transcript {
    border: 1px solid var(--color-phosphor-dim);
    padding: 12px;
    font-family: var(--font-mono);
    font-style: italic;
    font-size: 14px;
    color: var(--color-phosphor-dim);
    display: flex;
    gap: 8px;
  }
</style>

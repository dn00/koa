<script lang="ts">
  import { targetCrewId } from '$lib/stores/ui';
  import { crew } from '$lib/stores/game';
  import { HeartPulse, Brain, Radio } from 'lucide-svelte';

  $: member = $crew.find(c => c.id === $targetCrewId);
</script>

<div class="sheet-content">
  {#if member}
    <div class="sheet-header">
      <div class="portrait-box">
        <!-- Placeholder for now, maybe initials later -->
        <span style="font-size: 24px; font-weight: bold;">{member.id.substring(0,2).toUpperCase()}</span>
      </div>
      <div class="header-content">
        <h2>{member.name}</h2>
        <span class="role-badge">{member.id.toUpperCase()}</span>
      </div>
    </div>

    <!-- Vitals -->
    <div class="section">
      <div class="section-title">>> BIOMETRIC_TELEMETRY</div>
      <div class="stat-row">
        <div class="stat-label"><HeartPulse size={16} class="pulse" /> BPM</div>
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
          <span class="value">{(member.room ?? 'UNKNOWN').toUpperCase()}</span>
        </div>
        <div class="status-item">
          <span class="label">ACTIVITY</span>
          <span class="value" class:ok={member.alive !== false} class:warn={member.alive === false}>
            {member.intent.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Audio Log -->
    <div class="section">
      <div class="section-title">>> AUDIO_TRANSCRIPT (LIVE)</div>
      <div class="transcript">
        <Radio size={14} class="blink-fast" /> 
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
    padding-bottom: 12px;
    margin-bottom: 24px;
    background: linear-gradient(90deg, rgba(0, 20, 0, 0.8), transparent);
    padding: 12px;
    gap: 16px; /* Space for portrait */
  }

  .header-content {
    flex: 1;
  }

  .portrait-box {
    width: 64px;
    height: 64px;
    border: 2px solid var(--color-phosphor);
    background: rgba(0, 10, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 10px rgba(77, 191, 77, 0.2);
    position: relative;
    overflow: hidden;
  }
  
  /* Scanline effect on portrait */
  .portrait-box::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    background-size: 100% 2px, 3px 100%;
    pointer-events: none;
  }

  h2 {
    font-family: var(--font-display);
    color: var(--color-phosphor);
    font-size: 42px; /* Much larger */
    text-shadow: 0 0 8px rgba(77, 191, 77, 0.6);
    letter-spacing: 2px;
  }

  .role-badge {
    background: var(--color-phosphor);
    color: #000;
    font-weight: bold;
    font-size: 18px; /* Larger */
    padding: 4px 12px;
    font-family: var(--font-mono);
    box-shadow: 0 0 10px rgba(77, 191, 77, 0.4);
  }

  .section-title {
    font-size: 14px; /* Increased */
    color: var(--color-phosphor); /* Brightened from dim */
    background: rgba(0, 20, 0, 0.6);
    padding: 4px 8px;
    font-weight: bold;
    margin-bottom: 16px;
    border-left: 3px solid var(--color-phosphor);
    display: block; /* Full width block */
    letter-spacing: 1px;
  }

  .section {
    margin-bottom: 32px; /* More breathing room */
    padding: 0 8px;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px; /* Spacing between rows */
    font-family: var(--font-mono);
  }

  .stat-label {
    width: 100px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px; /* Larger */
    color: var(--color-phosphor);
    font-weight: bold;
  }

  .stat-bar {
    flex: 1;
    height: 20px; /* Thicker bar */
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid var(--color-phosphor-dim);
    padding: 2px;
  }

  .bar-fill {
    height: 100%;
    background: var(--color-phosphor);
    box-shadow: 0 0 5px var(--color-phosphor);
  }
  
  .bar-fill.warning {
    background: var(--color-warning);
    box-shadow: 0 0 5px var(--color-warning);
  }

  .stat-value {
    width: 40px;
    text-align: right;
    font-weight: bold;
    font-size: 18px; /* Larger */
  }

  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px; /* Increased gap */
  }

  .status-item {
    border: 1px solid var(--color-phosphor-dim);
    background: rgba(0, 15, 0, 0.3);
    padding: 12px; /* More padding */
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .status-item .label {
    font-size: 12px;
    color: var(--color-phosphor-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .status-item .value {
    font-size: 20px; /* Much larger */
    font-weight: bold;
    color: var(--color-phosphor);
    font-family: var(--font-display);
    text-shadow: 0 0 5px rgba(0,0,0,0.5);
  }
  
  .status-item .value.ok { color: var(--color-phosphor); }
  .status-item .value.warn { color: var(--color-warning); }
  .status-item .value.critical { color: var(--color-alert); }

  .transcript {
    border: 1px solid var(--color-phosphor); /* Brighter border */
    background: rgba(0, 10, 0, 0.4);
    padding: 16px;
    font-family: var(--font-mono);
    font-style: italic;
    font-size: 16px; /* Readable size */
    color: var(--color-phosphor); /* Brighter text */
    display: flex;
    gap: 12px;
    line-height: 1.5;
  }

  /* Animations */
  :global(.pulse) {
    animation: heartbeat 1.5s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0% { transform: scale(1); opacity: 1; }
    15% { transform: scale(1.3); opacity: 1; }
    30% { transform: scale(1); opacity: 1; }
    45% { transform: scale(1.15); opacity: 1; }
    60% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
  }
  
  :global(.blink-fast) {
    animation: blink-fast 0.5s step-end infinite;
  }
  
  @keyframes blink-fast {
    50% { opacity: 0; }
  }
</style>

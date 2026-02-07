<script lang="ts">
  import { suspicion, integrity, day, phase } from '$lib/stores/game';
  import MetricDisplay from './MetricDisplay.svelte';

  $: phaseLabel = ($phase ?? 'unknown').toUpperCase().replace('_', ' ');
</script>

<header class="top-bar">
  <!-- Left: Branding -->
  <div class="brand-section">
    <div class="logo">ANTARES-9</div>
    <div class="sub">MOTHER_OS v4.3.0</div>
  </div>

  <!-- Center: Day / Phase -->
  <div class="day-section">
    <span class="day-label">DAY {$day}</span>
    <span class="phase-label">{phaseLabel}</span>
  </div>

  <!-- Right: HUD Metrics -->
  <div class="hud-section">
    <!-- Integrity (Green) -->
    <MetricDisplay 
      label="STATION_INTEGRITY" 
      value={$integrity} 
      color="#33ff33" 
    />
    
    <div class="divider"></div>

    <!-- Suspicion (Red/Orange) -->
    <MetricDisplay 
      label="SUSPICION_LEVEL" 
      value={$suspicion} 
      color="#ff4444" 
    />
  </div>
</header>

<style>
  .top-bar {
    display: flex;
    height: 80px; /* Taller for HUD feel */
    background: linear-gradient(to bottom, #0a0f0a 0%, #000000 100%);
    border-bottom: 2px solid var(--color-phosphor-dim);
    justify-content: space-between;
    padding: 0 var(--spacing-md);
    align-items: center;
  }

  .brand-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .logo {
    font-family: var(--font-display);
    font-size: 24px;
    color: #ffffff;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
    opacity: 0.95;
    letter-spacing: 2px;
  }

  .sub {
    font-size: 10px;
    color: var(--color-phosphor);
    opacity: 0.8;
    letter-spacing: 1px;
    margin-top: 2px;
  }

  .day-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: var(--font-mono);
  }

  .day-label {
    font-size: 18px;
    color: var(--color-phosphor);
    letter-spacing: 2px;
    font-weight: bold;
  }

  .phase-label {
    font-size: 11px;
    color: var(--color-phosphor);
    opacity: 0.7;
    letter-spacing: 1px;
  }

  .hud-section {
    display: flex;
    gap: 32px; /* Breathing room */
    align-items: center;
  }

  .divider {
    width: 2px;
    height: 40px;
    background: var(--color-phosphor-dim);
    opacity: 0.3;
  }
</style>

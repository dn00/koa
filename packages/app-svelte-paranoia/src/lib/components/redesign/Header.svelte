<script lang="ts">
  import { suspicion, integrity } from '$lib/stores/game';
  import StatBar from './StatBar.svelte';
</script>

<header class="top-bar">
  <!-- Left: Branding / Station ID -->
  <div class="brand-section">
    <div class="logo">ANTARES-9</div>
    <div class="sub">MOTHER_OS v4.3.0</div>
  </div>

  <!-- Right: Meters -->
  <div class="meters-section">
    <div class="meter-wrapper">
      <!-- High Integrity is Good (Green) -->
      <StatBar 
        label="STATION_INTEGRITY" 
        value={$integrity} 
        color={$integrity > 50 ? 'var(--color-phosphor)' : 'var(--color-alert)'} 
      />
    </div>
    <div class="meter-wrapper">
      <!-- High Suspicion is Bad (Red) -->
      <StatBar 
        label="SUSPICION_LEVEL" 
        value={$suspicion} 
        color={$suspicion > 50 ? 'var(--color-alert)' : 'var(--color-phosphor)'} 
      />
    </div>
  </div>
</header>

<style>
  .top-bar {
    display: flex;
    height: 60px;
    background: #000; /* Solid black */
    border-bottom: 2px solid var(--color-phosphor-dim);
    justify-content: space-between; /* Push apart */
    padding: 0 var(--spacing-sm);
    align-items: center;
    gap: var(--spacing-md);
  }

  .brand-section {
    width: 150px;
    display: flex;
    flex-direction: column;
    /* Reset alignment to left */
    align-items: flex-start;
    text-align: left;
  }

  .logo {
    font-family: var(--font-display);
    font-size: 24px;
    color: var(--color-phosphor);
    text-shadow: 0 0 5px var(--color-phosphor);
  }

  .sub {
    font-size: 10px;
    color: var(--color-phosphor-dim);
  }

  .meters-section {
    display: flex;
    gap: var(--spacing-md);
    width: 400px;
  }

  .meter-wrapper {
    flex: 1;
  }
</style>

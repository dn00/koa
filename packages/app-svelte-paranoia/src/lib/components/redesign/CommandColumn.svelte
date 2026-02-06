<script lang="ts">
  import { threats } from '$lib/stores/game';
  import IncidentLog from './IncidentLog.svelte';
  import StationMap from '../StationMap.svelte';
  import CrewStrip from './CrewStrip.svelte';
</script>

<div class="command-column">
  <!-- Minimap (Top) -->
  <div class="section-header">>> SECTOR_MAP</div>
  <div class="minimap-container">
    <StationMap />
  </div>

  <!-- Incident Stack (Middle) -->
  <div class="section-header">>> INCIDENT_STACK</div>
  <div class="stack-container">
    <IncidentLog />
  </div>

  <!-- Crew Manifest (Bottom Sidebar) -->
  <div class="section-header">>> BIO_MONITORING</div>
  <div class="crew-container">
    <CrewStrip orientation="vertical" />
  </div>
</div>

<style>
  .command-column {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-left: 2px solid var(--color-phosphor-dim);
    background: rgba(0, 10, 0, 0.3);
  }

  .minimap-container {
    height: 250px;
    background: #000;
    border-bottom: 2px solid var(--color-phosphor-dim);
    overflow: hidden;
  }

  .scan-label {
    position: absolute;
    top: 8px;
    left: 12px;
    font-size: 10px;
    color: var(--color-phosphor); /* Brighter */
    background: #000;
    padding: 0 4px;
    z-index: 10;
    pointer-events: none;
    letter-spacing: 1px;
    opacity: 0.9; /* More visible (was 0.7 or dim) */
    text-shadow: 0 0 2px var(--color-phosphor-dim);
  }

  .section-header {
    background: var(--color-phosphor-dim);
    color: #000;
    padding: 4px 8px;
    font-weight: bold;
    font-family: var(--font-display);
    font-size: 18px;
  }

  .stack-container {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
    min-height: 200px;
  }
  
  .crew-container {
    height: 300px; /* Fixed height for crew list */
    border-top: 2px solid var(--color-phosphor-dim);
    padding: var(--spacing-sm);
    overflow-y: auto;
  }
</style>

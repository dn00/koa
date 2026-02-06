<script lang="ts">
  export let label: string;
  export let value: number; // 0-100
  export let color: string = 'var(--color-phosphor)';

  $: width = `${Math.max(0, Math.min(100, value))}%`;
  
  // Flash effect when critical
  $: critical = value < 20 || value > 80; // Generic logic, caller handles specific thresholds via color probably
</script>

<div class="stat-bar-container">
  <div class="bar-header">
    <span class="label">{label}</span>
    <span class="value" style:color={color}>{Math.round(value)}%</span>
  </div>
  
  <div class="track">
    <div 
      class="fill" 
      style:width={width}
      style:background-color={color}
      style:box-shadow={`0 0 10px ${color}`}
    ></div>
    
    <!-- Optional: Tick marks overlay -->
    <div class="scanline"></div>
  </div>
</div>

<style>
  .stat-bar-container {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    min-width: 200px; /* Ensure strictly visible width */
  }

  .bar-header {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    font-family: var(--font-display); 
    margin-bottom: 4px;
    align-items: flex-end;
  }

  .label {
    color: var(--color-phosphor-dim);
    letter-spacing: 1px;
    font-weight: bold;
  }

  .value {
    font-weight: bold;
    font-size: 16px;
    text-shadow: 0 0 5px currentColor;
  }

  .track {
    height: 24px;
    background: rgba(0, 10, 0, 0.8);
    border: 1px solid var(--color-phosphor-dim);
    position: relative;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
  }

  /* Scanline overlay for that CRT look on the bar itself */
  .scanline {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0) 50%,
      rgba(0,0,0,0.4) 50%
    );
    background-size: 100% 4px;
    z-index: 2;
    pointer-events: none;
  }
</style>

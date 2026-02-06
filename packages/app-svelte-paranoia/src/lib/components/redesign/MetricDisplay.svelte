<script lang="ts">
  export let label: string;
  export let value: number; // 0-100
  export let color: string = 'var(--color-phosphor)';
  export let align: 'left' | 'right' = 'right';

  $: displayValue = Math.round(value);
</script>

<div class="metric-display" class:align-left={align === 'left'}>
  <div class="header-row">
    <span class="label">{label}</span>
    <span class="value" style:color={color}>{displayValue}%</span>
  </div>
  
  <div class="bar-container">
    <div 
      class="bar-fill" 
      style:width="{value}%"
      style:background-color={color}
      style:box-shadow={`0 0 10px ${color}`}
    ></div>
  </div>
</div>

<style>
  .metric-display {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 180px; /* Wider for impact */
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .label {
    font-size: 12px;
    color: var(--color-phosphor);
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-shadow: 0 0 4px rgba(0,0,0,0.8);
  }

  .value {
    font-family: var(--font-display);
    font-size: 24px;
    line-height: 1;
    text-shadow: 0 0 8px currentColor;
  }

  .bar-container {
    width: 100%;
    height: 12px; /* Thicker bar */
    background: rgba(0, 10, 0, 0.6);
    border: 1px solid var(--color-phosphor-dim);
    padding: 2px; /* Inner bezel */
    box-shadow: inset 0 0 5px rgba(0,0,0,0.8);
  }

  .bar-fill {
    height: 100%;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  /* Optional scanline texture on bar */
  .bar-fill::after {
    content: '';
    position: absolute;
    top: 0; left: 0; 
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.3) 50%);
    background-size: 4px 100%;
    opacity: 0.5;
  }
</style>

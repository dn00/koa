<script lang="ts">
  import { integrity, suspicion, resetStage, cpu, power } from '$lib/stores/game';
  import { Activity, ShieldAlert, Cpu, Zap } from 'lucide-svelte';
</script>

<div class="top-bar">
  <div class="status-group">
    <div class="label">
      <Activity size={14} class="icon text-primary" />
      <span>INTEGRITY</span>
    </div>
    <div class="bar-container">
      <div class="bar-fill primary" style="width: {$integrity}%"></div>
    </div>
    <span class="value">{$integrity}%</span>
  </div>

  <div class="status-group">
    <div class="label">
      <ShieldAlert size={14} class="icon text-danger" />
      <span>SUSPICION</span>
    </div>
    <div class="bar-container">
      <div class="bar-fill danger" style="width: {$suspicion}%"></div>
    </div>
    <span class="value">{$suspicion}%</span>
  </div>

  <div class="resources">
    <div class="resource">
      <Cpu size={12} class="text-dim" />
      <span>{$cpu}</span>
    </div>
    <div class="resource">
      <Zap size={12} class="text-dim" />
      <span>{$power}</span>
    </div>
  </div>
</div>

<style>
  .top-bar {
    height: var(--header-height);
    background: var(--color-bg-surface);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    padding: 0 var(--spacing-md);
    gap: var(--spacing-md);
    font-size: 13px;
    font-weight: 600;
  }

  .status-group {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .label {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 85px;
  }

  .bar-container {
    flex: 1;
    height: 6px;
    background: var(--color-bg-surface-2);
    border-radius: 2px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    transition: width 0.3s ease;
  }
  .bar-fill.primary { background: var(--color-primary); box-shadow: 0 0 8px var(--color-primary-dim); }
  .bar-fill.danger { background: var(--color-danger); box-shadow: 0 0 8px var(--color-danger-dim); }

  .value {
    font-family: var(--font-mono);
    min-width: 32px;
    text-align: right;
  }

  .resources {
    display: flex;
    gap: var(--spacing-sm);
    padding-left: var(--spacing-sm);
    border-left: 1px solid var(--color-border);
  }

  .resource {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-text-dim);
    font-family: var(--font-mono);
    font-size: 12px;
  }
  
  /* Mobile tweak */
  @media (max-width: 400px) {
    .label span { display: none; }
    .label { min-width: auto; }
    .resources { display: none; }
  }
</style>

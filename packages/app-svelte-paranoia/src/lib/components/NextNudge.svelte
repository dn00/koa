<script lang="ts">
  import { threats } from '$lib/stores/game';
  import { UserPlus, ArrowRight } from 'lucide-svelte';

  // Naive recommendation engine
  $: nextAction = $threats.length > 0 
    ? `Dispatch Crew to ${$threats[0].room}` 
    : "Monitor Systems";
</script>

<div class="next-nudge">
  <div class="label">NEXT</div>
  <div class="content">
    <span>{nextAction}</span>
    <div class="arrow">
      <ArrowRight size={14} />
    </div>
  </div>
</div>

<style>
  .next-nudge {
    margin: 0 var(--spacing-md) var(--spacing-sm) var(--spacing-md);
    background: linear-gradient(90deg, var(--color-bg-surface-2), var(--color-bg-surface));
    border: 1px solid var(--color-primary-dim);
    border-radius: 6px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideIn 0.5s ease-out;
  }

  .label {
    background: var(--color-primary-dim);
    color: var(--color-bg);
    font-size: 10px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-primary);
  }
  
  .arrow {
    opacity: 0.7;
  }

  @keyframes slideIn {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>

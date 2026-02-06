<script lang="ts">
  import { activeSheet } from '$lib/stores/ui';
  import { Zap, Eye, Edit3 } from 'lucide-svelte';

  function openSheet(sheet: 'ACT' | 'VERIFY' | 'CURATE') {
    activeSheet.set(sheet);
  }
</script>

<div class="action-dock">
  <button class="action-btn act" on:click={() => openSheet('ACT')}>
    <div class="icon-circle">
      <Zap size={24} />
    </div>
    <span class="label">ACT</span>
  </button>

  <button class="action-btn verify" on:click={() => openSheet('VERIFY')}>
    <div class="icon-circle">
      <Eye size={24} />
    </div>
    <span class="label">VERIFY</span>
  </button>

  <button class="action-btn curate" on:click={() => openSheet('CURATE')}>
    <div class="icon-circle">
      <Edit3 size={24} />
    </div>
    <span class="label">CURATE</span>
  </button>
</div>

<style>
  .action-dock {
    display: flex;
    justify-content: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-md);
    padding-bottom: var(--spacing-lg);
    background: linear-gradient(to top, var(--color-bg) 20%, transparent);
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .action-btn:active {
    transform: scale(0.9);
  }

  .icon-circle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-surface-2);
    border: 1px solid var(--color-border);
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    transition: all 0.2s ease;
  }

  .label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--color-text-dim);
  }

  /* ACT */
  .act .icon-circle { border-color: var(--color-primary-dim); color: var(--color-primary); }
  .act:active .icon-circle { background: var(--color-primary); color: #000; }

  /* VERIFY */
  .verify .icon-circle { border-color: var(--color-success); color: var(--color-success); }
  .verify:active .icon-circle { background: var(--color-success); color: #000; }

  /* CURATE */
  .curate .icon-circle { border-color: var(--color-warning); color: var(--color-warning); }
  .curate:active .icon-circle { background: var(--color-warning); color: #000; }
</style>

<script lang="ts">
  import { CheckCircle } from 'lucide-svelte';
</script>

<div class="sheet-header">
  <h2>VERIFY</h2>
  <p class="subtitle">Resolve Doubts to lower Suspicion</p>
</div>

<div class="section-title">ACTIVE DOUBTS (High Priority)</div>

<div class="doubt-list">
  <div class="doubt-card">
    <div class="doubt-header">
      <span class="topic">Sabotage in Cargo?</span>
      <span class="severity">HIGH</span>
    </div>
    <div class="doubt-meta">
      <span>Holders: Vega, Rook</span>
      <span>•</span>
      <span>TTL: 45s</span>
    </div>
    <button class="resolve-btn">
      <CheckCircle size={16} />
      <span>Audit Telemetry (-6 Suspicion)</span>
    </button>
  </div>
</div>

<style>
  .sheet-header {
    margin-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--color-phosphor-dim);
    padding-bottom: 8px;
  }

  h2 {
    font-family: var(--font-display);
    color: var(--color-phosphor);
    font-size: 42px; /* Consistency with CrewSheet */
    text-shadow: 0 0 8px rgba(77, 191, 77, 0.6);
    letter-spacing: 2px;
    margin-bottom: 4px;
  }
  
  .subtitle {
    font-size: 14px;
    color: var(--color-phosphor); /* Brighter */
    opacity: 0.8;
    font-family: var(--font-mono);
  }

  .section-title {
    font-size: 14px; /* Increased */
    font-weight: 700;
    color: var(--color-phosphor); /* Brighter */
    background: rgba(0, 20, 0, 0.6); /* Block style */
    padding: 4px 8px;
    margin: var(--spacing-md) 0 var(--spacing-sm);
    letter-spacing: 1px;
    border-left: 3px solid var(--color-phosphor); /* Left border accent */
    display: block; /* Full width */
  }

  .doubt-card {
    background: transparent;
    border: 1px solid var(--color-alert); /* Red border for doubts */
    padding: 12px;
    border-radius: 0;
    margin-bottom: 8px;
  }

  .doubt-header {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    margin-bottom: 4px;
    color: var(--color-alert);
  }

  .severity {
    color: #000;
    background: var(--color-alert);
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 0;
  }

  .doubt-meta {
    font-size: 11px;
    color: var(--color-phosphor-dim);
    margin-bottom: 12px;
    font-family: var(--font-mono);
  }

  .resolve-btn {
    width: 100%;
    background: transparent;
    color: var(--color-phosphor);
    padding: 10px;
    border: 1px solid var(--color-phosphor);
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
    font-size: 13px;
    font-family: var(--font-mono);
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .resolve-btn:hover {
    background: var(--color-phosphor);
    color: #000;
    box-shadow: 0 0 10px var(--color-phosphor);
  }
</style>

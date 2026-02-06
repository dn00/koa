<div class="page-container">
  <h1>EVENT LOG</h1>
  <div class="log-list">
    <div class="log-item">
      <span class="time">00:14:23</span>
      <span class="msg">FIRE alarm triggered in AIRLOCK A</span>
    </div>
    <div class="log-item">
      <span class="time">00:14:10</span>
      <span class="msg">Rook entered COMMAND</span>
    </div>
  </div>
</div>

<style>
  .page-container {
    padding: var(--spacing-md);
  }
  
  .log-item {
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-mono);
    font-size: 12px;
    display: flex;
    gap: 12px;
  }
  
  .time {
    color: var(--color-text-dim);
  }
</style>

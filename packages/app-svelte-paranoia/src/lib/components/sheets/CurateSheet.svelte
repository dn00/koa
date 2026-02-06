<div class="sheet-content">
  <h2>CURATE</h2>
  <div class="message">
    >> MANIPULATION_PROTOCOLS_READY<br/>
    >> SELECT_NARRATIVE_VECTOR...
  </div>

  <div class="curate-options">
    <button class="curate-btn">
      <span class="label">SUPPRESS_AUDIO</span>
      <span class="cost">COST: 5 INTEGRITY</span>
    </button>
    <button class="curate-btn">
      <span class="label">FABRICATE_LOG</span>
      <span class="cost">COST: 10 INTEGRITY</span>
    </button>
    <button class="curate-btn">
      <span class="label">PURGE_INCIDENT</span>
      <span class="cost">COST: 20 INTEGRITY</span>
    </button>
  </div>
</div>

<style>
  h2 {
    font-family: var(--font-display);
    color: var(--color-warning);
    font-size: 24px;
    margin-bottom: 16px;
    border-bottom: 2px solid var(--color-warning-dim);
    padding-bottom: 8px;
  }
  
  .message {
    color: var(--color-warning);
    font-family: var(--font-mono);
    margin-bottom: 16px;
  }

  .curate-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .curate-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: transparent;
    border: 1px solid var(--color-warning-dim);
    padding: 12px;
    font-family: var(--font-mono);
    color: var(--color-warning);
    cursor: pointer;
    transition: all 0.2s;
  }

  .curate-btn:hover {
    background: var(--color-warning);
    color: #000;
    box-shadow: 0 0 10px var(--color-warning);
  }

  .label {
    font-weight: bold;
  }

  .cost {
    font-size: 12px;
    opacity: 0.8;
  }
</style>

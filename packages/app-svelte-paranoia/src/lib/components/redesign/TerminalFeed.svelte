<script lang="ts">
  import { logs } from '$lib/stores/game';
  import { activeSheet, focusRoomId, targetCrewId } from '$lib/stores/ui';
  import SheetContainer from '$lib/components/sheets/SheetContainer.svelte';
  import { onMount, afterUpdate } from 'svelte';

  let scrollContainer: HTMLElement;
  
  function openSheet(sheet: 'ACT' | 'VERIFY' | 'CURATE') {
    activeSheet.set(sheet);
  }

  function handleLogClick(log: any) {
    if (!log.metadata) return;

    if (log.metadata.type === 'ROOM') {
      focusRoomId.set(log.metadata.id);
      activeSheet.set('ACT');
    } else if (log.metadata.type === 'CREW') {
      targetCrewId.set(log.metadata.id);
      activeSheet.set('CREW');
    }
  }

  // Auto-scroll to bottom of LOG STREAM, not container
  afterUpdate(() => {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  function getMessageStyle(log: any) {

    // Source-specific overrides
    if (log.source === 'MOTHER') return 'color: #ffffff; text-shadow: 0 0 2px rgba(255,255,255,0.5);';
    if (log.source === 'BIO') return 'color: #00ffff;'; /* Cyan */
    if (log.source === 'ALERT') return 'color: var(--color-alert);';
    if (log.source === 'COMMS') return 'color: #aaddff; font-style: italic;'; /* Light Blue Italic */

    // Severity overrides
    if (log.severity === 'CRITICAL') return 'color: var(--color-alert); font-weight: bold; animation: blink 1s infinite;';

    // Default fallback
    switch (log.type) {
      case 'error': return 'color: var(--color-alert);';
      case 'warning': return 'color: var(--color-warning);';
      case 'success': return 'color: var(--color-phosphor);';
      default: return 'color: var(--color-phosphor-dim);';
    }
  }
</script>

<div class="terminal-layout">
  <!-- Scrollable Log Stream -->
  <div class="log-stream" bind:this={scrollContainer}>
    {#each $logs as log (log.id)}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div 
        class="log-line" 
        class:interactive={!!log.metadata}
        on:click={() => handleLogClick(log)}
      >
        <span class="timestamp">[{log.timestamp}]</span>
        <span class="source" 
          class:alert={log.source === 'ALERT'} 
          class:bio={log.source === 'BIO'} 
          class:mother={log.source === 'MOTHER'}
          class:system={log.source === 'SYSTEM'}>
          [{log.source}]
        </span>
        {#if log.severity}
          <span class="severity-badge" 
            class:crit={log.severity === 'CRITICAL'}
            class:high={log.severity === 'HIGH'} 
            class:med={log.severity === 'MEDIUM'}
            class:low={log.severity === 'LOW'}>
            {log.severity}
          </span>
        {/if}
        <span class="message" style={getMessageStyle(log)}>
          {@html log.message}
        </span>
        {#if log.metadata}
           <span class="interact-hint">&lt;ACCESS&gt;</span>
        {/if}
      </div>
    {/each}
  </div>
  
  <!-- Docked Command Area -->
  <div class="command-bar">
    <div class="cursor-line">
      <span class="prompt">MOTHER></span>
      <span class="cursor">_</span>
    </div>
    
    <div class="action-buttons">
      <button class="cmd-btn" on:click={() => openSheet('ACT')}>ACT</button>
      <button class="cmd-btn" on:click={() => openSheet('VERIFY')}>VERIFY</button>
      <button class="cmd-btn cur" on:click={() => openSheet('CURATE')}>CURATE</button>
    </div>
  </div>

  <!-- TUI Overlays -->
  <SheetContainer />
</div>

<style>
  .terminal-layout {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: rgba(10, 15, 10, 0.95); /* Matches new bg theme */
    overflow: hidden; /* Main container doesn't scroll */
    position: relative;
  }

  .log-stream {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
    padding-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* Custom Scrollbar */
  .log-stream::-webkit-scrollbar {
    width: 6px;
  }
  .log-stream::-webkit-scrollbar-track {
    background: #001100;
  }
  .log-stream::-webkit-scrollbar-thumb {
    background: var(--color-phosphor-dim);
    border-radius: 2px;
  }

  .log-line {
    display: flex;
    gap: 8px;
    font-size: 14px;
    line-height: 1.4;
    padding: 2px 4px; /* Touch target */
    border-left: 2px solid transparent; /* Selection indicator */
  }
  
  .log-line.interactive {
    cursor: pointer;
    /* Subtle hint it's clickable */
  }
  
  .log-line.interactive:hover {
    background: rgba(51, 255, 51, 0.1);
    border-left-color: var(--color-phosphor);
  }

  .timestamp {
    color: var(--color-phosphor); /* Brighter */
    opacity: 0.8; /* More visible */
    white-space: nowrap;
    font-size: 12px;
    margin-top: 2px;
  }

  .source {
    color: var(--color-phosphor); /* Brighter default for SYSTEM etc */
    font-weight: bold;
    min-width: 80px;
    letter-spacing: 0.5px;
  }
  
  .source.alert {
    color: var(--color-alert);
    text-shadow: 0 0 5px var(--color-alert-dim);
  }
  
  .source.bio {
    color: #00ffff; /* Cyan to match message */
    text-shadow: 0 0 5px rgba(0, 255, 255, 0.4);
  }
  
  .source.system {
    color: #88ff88; /* Pale green */
  }

  .source.mother {
    color: #ffffff; /* Pure white */
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
  }
  
  .severity-badge {
    font-size: 10px;
    font-weight: bold;
    padding: 1px 4px;
    border-radius: 2px;
    margin-right: 8px;
    align-self: center;
    color: #000;
  }
  
  .severity-badge.high {
    background: var(--color-alert);
    box-shadow: 0 0 5px var(--color-alert);
    animation: blink 1s step-end infinite;
  }
  
  .severity-badge.med {
    background: var(--color-warning);
    color: #000;
  }
  
  .severity-badge.low {
    background: var(--color-phosphor-dim);
    color: #000;
  }

  .message {
    flex: 1;
    white-space: pre-wrap;
  }
  
  .interact-hint {
    font-size: 10px;
    color: var(--color-phosphor-dim);
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .log-line.interactive:hover .interact-hint {
    opacity: 1;
  }
  
  /* Command Input Area */
  .command-bar {
    border-top: 2px solid var(--color-phosphor-dim);
    padding: var(--spacing-sm);
    background: rgba(15, 25, 15, 0.98); /* Slightly lighter for separation */
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex-shrink: 0; /* Never shrink */
    padding-bottom: 16px; /* Nice bottom padding */
  }

  .cursor-line {
    display: flex;
    gap: 8px;
    font-size: 14px;
    align-items: center;
    padding: 0 4px;
  }

  .prompt {
    color: var(--color-phosphor);
    font-weight: bold;
  }

  .cursor {
    color: var(--color-phosphor);
    animation: blink 1s step-end infinite;
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
    width: 100%;
  }
  
  .cmd-btn {
    flex: 1; /* Distributed Evenly */
    height: 56px; /* Larger Touch Target */
    background: rgba(0, 20, 0, 0.6);
    border: 1px solid var(--color-phosphor-dim);
    color: var(--color-phosphor);
    font-family: var(--font-display); /* Display Font for Actions */
    font-size: 18px; /* Larger Text */
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  
  /* Corner accents for buttons */
  .cmd-btn::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 4px;
    border-top: 2px solid var(--color-phosphor);
    border-left: 2px solid var(--color-phosphor);
    opacity: 0.5;
  }
  .cmd-btn::after {
    content: '';
    position: absolute;
    bottom: 0; right: 0;
    width: 4px; height: 4px;
    border-bottom: 2px solid var(--color-phosphor);
    border-right: 2px solid var(--color-phosphor);
    opacity: 0.5;
  }
  
  .cmd-btn:hover {
    background: var(--color-phosphor);
    color: #000;
    border-color: var(--color-phosphor);
    box-shadow: 0 0 15px rgba(51, 255, 51, 0.3);
  }
  
  .cmd-btn:active {
    transform: translateY(2px);
  }
  
  /* Curate is special (Golden) */
  .cmd-btn.cur {
    border-color: var(--color-warning-dim);
    color: var(--color-warning);
    background: rgba(40, 30, 0, 0.6);
  }
  .cmd-btn.cur::before, .cmd-btn.cur::after {
    border-color: var(--color-warning);
  }
  
  .cmd-btn.cur:hover {
    background: var(--color-warning);
    color: #000;
    box-shadow: 0 0 15px rgba(255, 204, 0, 0.4);
  }
</style>

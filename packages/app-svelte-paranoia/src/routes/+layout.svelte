<script lang="ts">
  import '../app.css';
  import CommandColumn from '$lib/components/redesign/CommandColumn.svelte';
  import Header from '$lib/components/redesign/Header.svelte';
  import TerminalFeed from '$lib/components/redesign/TerminalFeed.svelte';
  import { onMount, afterUpdate } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { activeTab } from '$lib/stores/ui';

  onMount(() => {
    if ($page.url.pathname === '/') {
      goto('/ops');
    }
    // Default to OPS tab
    $activeTab = 'OPS';
  });
</script>

<div class="terminal-grid">
  <!-- Top: Header (Metrics/Status) -->
  <header class="header-row">
    <Header />
  </header>

  <!-- Desktop: Both Visible / Mobile: Toggled via activeTab -->
  <main class="viewport" class:hidden-mobile={$activeTab !== 'OPS'}>
    <div class="screen-label">>> MOTHER_CONSOLE_DISPLAY</div>
    <div class="terminal-wrapper">
       <TerminalFeed />
    </div>
  </main>

  <aside class="command-col" class:hidden-mobile={$activeTab !== 'STATION'}>
    <CommandColumn />
  </aside>

  <!-- Mobile Tab Bar (Bottom) -->
  <nav class="mobile-tabs">
    <button 
      class="tab-btn" 
      class:active={$activeTab === 'OPS'} 
      on:click={() => $activeTab = 'OPS'}
    >
      TERMINAL
    </button>
    <button 
      class="tab-btn" 
      class:active={$activeTab === 'STATION'} 
      on:click={() => $activeTab = 'STATION'}
    >
      STATION
    </button>
  </nav>
</div>

<style>
  .terminal-grid {
    display: grid;
    grid-template-columns: 1fr 350px; /* Map | Command */
    grid-template-rows: auto 1fr;    /* Header | Main */
    height: 100vh;
    width: 100vw;
    background: var(--color-bg);
    padding: var(--spacing-sm);
    gap: var(--spacing-sm);
  }

  .header-row {
    grid-column: 1 / 3;
    grid-row: 1 / 2;
  }

  .viewport {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
    position: relative;
    border: 2px solid var(--color-phosphor-dim);
    background: rgba(0, 10, 0, 0.2);
    overflow: hidden;
  }

  .terminal-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .command-col {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    overflow: hidden;
  }

  .screen-label {
    position: absolute;
    top: 8px;
    left: 8px;
    font-size: 12px;
    color: var(--color-phosphor-dim);
    z-index: 10;
    pointer-events: none;
  }
  
  .mobile-tabs {
    display: none; /* Hidden on desktop */
  }

  /* Mobile Stack */
  @media (max-width: 768px) {
    .terminal-grid {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr 50px; /* Header | Content | Tabs */
      padding: 0;
      gap: 0;
    }
    
    .header-row {
      grid-column: 1;
      grid-row: 1;
    }
    
    /* Both columns take full central area */
    .viewport, 
    .command-col { 
      grid-column: 1; 
      grid-row: 2; 
      border-left: none;
      border-right: none;
    }
    
    .hidden-mobile {
      display: none;
    }
    
    .mobile-tabs {
      display: flex;
      grid-row: 3;
      border-top: 2px solid var(--color-phosphor-dim);
      background: #000;
    }
    
    .tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--color-phosphor-dim);
      font-family: var(--font-display);
      font-size: 18px;
      cursor: pointer;
      border-right: 1px solid var(--color-phosphor-dim);
    }
    
    .tab-btn:last-child {
      border-right: none;
    }
    
    .tab-btn.active {
      background: var(--color-phosphor);
      color: #000;
      font-weight: bold;
    }
  }
</style>

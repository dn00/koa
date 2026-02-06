<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Map, List, Users, Shield } from 'lucide-svelte';

  $: path = $page.url.pathname;
  $: activeTab = path.split('/')[1] || 'ops';
</script>

<div class="bottom-nav">
  <button class:active={activeTab === 'ops'} on:click={() => goto('/ops')}>
    <Map size={20} />
    <span>OPS</span>
  </button>
  
  <button class:active={activeTab === 'log'} on:click={() => goto('/log')}>
    <List size={20} />
    <span>LOG</span>
  </button>
  
  <button class:active={activeTab === 'crew'} on:click={() => goto('/crew')}>
    <Users size={20} />
    <span>CREW</span>
  </button>
  
  <button class:active={activeTab === 'trust'} on:click={() => goto('/trust')}>
    <Shield size={20} />
    <span>TRUST</span>
  </button>
</div>

<style>
  .bottom-nav {
    height: var(--bottom-nav-height);
    background: var(--color-bg-surface);
    border-top: 1px solid var(--color-border);
    display: flex;
    padding-bottom: var(--safe-area-bottom);
  }

  button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--color-text-dim);
    transition: all 0.2s ease;
  }

  button:active {
    background: var(--color-bg-surface-2);
  }

  button.active {
    color: var(--color-primary);
    background: rgba(0, 240, 255, 0.05);
    box-shadow: inset 0 -2px 0 var(--color-primary);
  }

  span {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
</style>

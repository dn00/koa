<script lang="ts">
  import { activeSheet, targetCrewId } from '$lib/stores/ui';
  import { crew } from '$lib/stores/game';
  export let orientation: 'horizontal' | 'vertical' = 'horizontal';

  $: members = $crew.map(c => ({
    id: c.id,
    name: c.name.toUpperCase(),
    status: c.alive === false ? 'DEAD' : (c.hp !== null && c.hp < 50) ? 'WARN' : 'OK'
  }));

  function openCrew(id: string) {
    targetCrewId.set(id);
    activeSheet.set('CREW');
  }
</script>

<div class="crew-strip {orientation}">
  {#each members as member}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="crew-card"
      class:warn={member.status === 'WARN'}
      class:dead={member.status === 'DEAD'}
      on:click={() => openCrew(member.id)}
    >
      <div class="portrait-frame">
        <div class="silhouette"></div>
      </div>
      <div class="info">
        <span class="name">{member.name}</span>
      </div>
    </div>
  {/each}
</div>

<style>
  .crew-strip {
    display: flex;
    gap: 4px; /* Tight gap */
    height: 100%;
    overflow-x: auto; /* Scroll if too many */
  }
  
  .crew-strip.vertical {
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    height: auto;
    width: 100%;
  }

  .crew-card {
    flex: 1;
    min-width: 100px; /* Minimum width */
    border: 1px solid var(--color-phosphor-dim);
    display: flex;
    flex-direction: row; /* Horizontal layout */
    align-items: center;
    padding: 4px;
    gap: 8px;
    background: rgba(0, 20, 0, 0.2);
    transition: all 0.2s;
    cursor: pointer;
    min-height: 40px; /* Consitent height */
  }
  
  .crew-strip.vertical .crew-card {
    width: 100%;
    min-width: 0;
  }

  .crew-card:hover {
    background: var(--color-phosphor-dim);
    color: #000;
  }
  
  .crew-card:hover .portrait-frame {
    border-color: #000;
  }
  
  .crew-card.warn {
    border-color: var(--color-warning);
    background: rgba(255, 204, 0, 0.1);
  }

  .crew-card.dead {
    border-color: var(--color-alert);
    background: rgba(255, 0, 0, 0.1);
    opacity: 0.6;
  }

  .portrait-frame {
    width: 32px;
    height: 32px;
    background: #000;
    border: 1px solid var(--color-phosphor-dim);
    position: relative;
    overflow: hidden;
    /* Dither effect simulation */
    background-image: radial-gradient(var(--color-phosphor-dim) 15%, transparent 16%);
    background-size: 3px 3px;
    flex-shrink: 0;
  }

  .info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 12px;
    line-height: 1.2;
    overflow: hidden;
  }
  
  .name {
    font-weight: bold;
    font-family: var(--font-display);
    font-size: 16px;
  }
  
  .role {
    font-size: 10px;
    opacity: 0.7;
    font-family: var(--font-mono);
  }
</style>

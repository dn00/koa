<script lang="ts">
  import { ROOMS, CONNECTIONS } from '$lib/data/station';
  import { focusRoomId } from '$lib/stores/ui';
  import { threats, crew } from '$lib/stores/game';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  function selectRoom(id: string) {
    focusRoomId.set(id);
    dispatch('select', id);
  }

  // Helpers
  $: getThreat = (roomId: string) => $threats.find(t => t.room === roomId);
  $: getCrewInRoom = (roomId: string) => $crew.filter(c => c.room === roomId);

  // Layout Helper: Calculate visual center of a room
  function getCenter(r: any) {
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }

  // Path Helper: Simple Manhattan routing (L-shape)
  function getCorridorPath(r1: any, r2: any) {
    const c1 = getCenter(r1);
    const c2 = getCenter(r2);
    
    // Special Case: Mines (Exterior) - Use direct/diagonal or special routing?
    // Or just Keep Manhattan but maybe specific order for visuals.
    
    return `M ${c1.x} ${c1.y} L ${c2.x} ${c1.y} L ${c2.x} ${c2.y}`;
  }
  
  function isExterior(from: any, to: any) {
    return from.id === 'mines' || to.id === 'mines';
  }
</script>

<div class="map-container">
  <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <!-- Hull Outline (The Ship) -->
    <!-- Approximate bounding box of the main ship cluster -->
    <path 
      d="M 5,5 L 95,5 L 95,65 L 75,65 L 75,95 L 25,95 L 25,65 L 5,65 Z"
      fill="none"
      stroke="var(--color-phosphor-dim)"
      stroke-width="0.5"
      stroke-dasharray="4 2"
      opacity="0.3"
    />

    <!-- Connections (Corridors) -->
    {#each CONNECTIONS as conn}
      {@const from = ROOMS.find(r => r.id === conn.from)}
      {@const to = ROOMS.find(r => r.id === conn.to)}
      {#if from && to}
        <path 
          d={getCorridorPath(from, to)}
          class="corridor"
          class:exterior={isExterior(from, to)}
        />
      {/if}
    {/each}

    <!-- Rooms -->
    {#each ROOMS as room}
      {@const isFocused = $focusRoomId === room.id}
      {@const threat = getThreat(room.id)}
      
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <g 
        class="room-node" 
        class:focused={isFocused}
        class:has-threat={!!threat}
        on:click={() => selectRoom(room.id)}
        role="button"
        tabindex="0"
      >
        <!-- Room Shape (Blueprint Rect) -->
        <rect 
          x={room.x} y={room.y} 
          width={room.w} height={room.h}
          class="room-shape"
          class:blink={threat}
          fill={threat ? 'var(--color-alert-glow)' : 'rgba(0, 20, 0, 0.8)'}
        />

        <!-- Scanner Ripple (Focused) -->
        {#if isFocused}
           <rect 
             x={room.x - 2} y={room.y - 2} 
             width={room.w + 4} height={room.h + 4} 
             class="ripple-rect"
             fill="none"
             stroke="var(--color-phosphor)"
           />
        {/if}

        <!-- Crew Dots (Distributed inside rect) -->
        {#each getCrewInRoom(room.id) as member, i}
          <g transform="translate({room.x + room.w/2}, {room.y + room.h/2})">
             <!-- Random orbit offset based on index to spread them out slightly -->
             <circle 
               cx={0} cy={0} r="1.5"
               fill="#fff" 
               class="crew-dot"
               style="animation-delay: {i * -1.5}s; transform-origin: {Math.cos(i)*4}px {Math.sin(i)*4}px;"
             />
          </g>
        {/each}

        <!-- Label -->
        <text 
          x={room.x + room.w/2} 
          y={room.y + room.h + 5} 
          text-anchor="middle" 
          font-size="3" 
          fill="var(--color-phosphor-dim)"
          class="room-label"
        >{room.name}</text>

        <!-- Threat Icon -->
        {#if threat}
           <g transform="translate({room.x + room.w - 5}, {room.y - 5}) scale(0.15)">
             <circle cx="12" cy="12" r="10" fill="var(--color-danger)" />
           </g>
        {/if}
      </g>
    {/each}
  </svg>
</div>

<style>
  .map-container {
    width: 100%;
    height: 100%;
    /* Hex grid background */
    background-image: 
      linear-gradient(var(--color-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--color-grid) 1px, transparent 1px);
    background-size: 40px 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid var(--color-phosphor-dim);
    box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
  }

  svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 2px var(--color-phosphor-dim));
  }

  .corridor {
    fill: none;
    stroke: var(--color-phosphor-dim);
    stroke-width: 1.5;
    opacity: 0.5;
    transition: all 0.2s;
  }
  
  .corridor:hover {
    stroke: var(--color-phosphor);
    opacity: 1;
    stroke-width: 2.5;
    filter: drop-shadow(0 0 2px var(--color-phosphor));
  }

  .corridor.exterior {
    stroke-dasharray: 2 2;
    stroke: var(--color-warning-dim);
  }

  .room-shape {
    stroke: var(--color-phosphor);
    stroke-width: 1;
    transition: all 0.2s;
  }
  
  .room-node:hover .room-shape {
    fill: var(--color-phosphor-dim);
    stroke-width: 2;
  }
  
  .room-node.focused .room-shape {
    stroke: var(--color-phosphor);
    stroke-width: 2;
    fill: rgba(51, 255, 51, 0.2);
  }

  .ripple-rect {
    animation: ripple-rect 1.5s infinite;
  }

  @keyframes ripple-rect {
    0% { transform: scale(1); opacity: 1; stroke-width: 1.5; }
    100% { transform: scale(1.1); opacity: 0; stroke-width: 0; }
  }

  .crew-dot {
    animation: orbit 4s linear infinite;
  }

  @keyframes orbit {
    0% { transform: rotate(0deg) translate(2px) rotate(0deg); }
    100% { transform: rotate(360deg) translate(2px) rotate(-360deg); }
  }
</style>

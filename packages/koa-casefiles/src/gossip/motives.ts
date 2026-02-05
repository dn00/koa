/**
 * Emergent Motive Derivation
 * 
 * Derives motives from actual simulated state, not templates.
 * Priority:
 * 1. Active grudge → revenge
 * 2. Recent gossip about item owner → embarrassment/cover_up  
 * 3. Low affinity → rivalry/envy
 * 4. High affinity with victim of item owner → protective
 * 5. Random chaos (fallback)
 */

import type { NPCId, ItemId, NPC, Item, World } from '../types.js';
import type { Motive, MotiveType } from '../types.js';
import type { RNG } from '../kernel/rng.js';
import type {
    GossipState,
    CaseHistory,
    Grudge,
    Gossip,
} from './types.js';
import { getAffinity, getWorstEnemy, getBestFriend } from './relationships.js';
import { getGrudgesFrom, getLastCrimeBy, narrateCaseSummary } from './history.js';
import { getGossipAbout, getGossipKnownBy } from './rumors.js';

// ============================================================================
// Motive Derivation
// ============================================================================

export function deriveEmergentMotive(
    culprit: NPC,
    targetItem: Item,
    world: World,
    gossipState: GossipState,
    history: CaseHistory,
    rng: RNG
): Motive {
    // Find item "owner" (who is most associated with it - for now, who spends most time in that room)
    const itemOwner = findItemAssociation(targetItem, world, rng);

    // 1. Check for active grudge
    const grudges = getGrudgesFrom(history, culprit.id);
    if (grudges.length > 0 && rng.nextInt(100) < 70) { // 70% chance to use grudge
        const grudge = grudges[0];
        return createGrudgeMotive(culprit, grudge, targetItem, history);
    }

    // 2. Check for gossip-driven motive
    const heardGossip = getGossipKnownBy(gossipState, culprit.id);
    const gossipAboutOwner = heardGossip.filter(g => g.subjectNpc === itemOwner);
    if (gossipAboutOwner.length > 0 && rng.nextInt(100) < 50) {
        return createGossipMotive(culprit, itemOwner, gossipAboutOwner[0], targetItem, world);
    }

    // 3. Check affinity-driven motive
    const worstEnemy = getWorstEnemy(gossipState.affinities, culprit.id);
    if (worstEnemy && worstEnemy.value < 30) {
        if (worstEnemy.to === itemOwner) {
            // Targeting enemy's item
            return createRivalryMotive(culprit, worstEnemy.to, targetItem, worstEnemy.value, world);
        }
        if (rng.nextInt(100) < 30) {
            // Frame enemy
            return createFrameMotive(culprit, worstEnemy.to, targetItem, world);
        }
    }

    // 4. Check for protective motive (helping a friend)
    const bestFriend = getBestFriend(gossipState.affinities, culprit.id);
    if (bestFriend && bestFriend.value > 70 && rng.nextInt(100) < 20) {
        return createProtectiveMotive(culprit, bestFriend.to, targetItem, world);
    }

    // 5. Fallback to chaos
    return createChaosMotive(culprit, targetItem, rng);
}

// ============================================================================
// Motive Creators
// ============================================================================

function createGrudgeMotive(
    culprit: NPC,
    grudge: Grudge,
    targetItem: Item,
    history: CaseHistory
): Motive {
    const targetNpc = grudge.to;

    return {
        type: 'revenge',
        target: targetNpc,
        description: `${culprit.name} still hasn't forgiven ${targetNpc}`,
        funnyReason: `"${grudge.reason}" - it's been ${Math.ceil(grudge.intensity)} intensity levels of anger`,
    };
}

function createGossipMotive(
    culprit: NPC,
    itemOwner: NPCId | null,
    gossip: Gossip,
    targetItem: Item,
    world: World
): Motive {
    const ownerName = world.npcs.find(n => n.id === itemOwner)?.name ?? 'someone';

    if (gossip.type === 'deed') {
        return {
            type: 'embarrassment',
            target: itemOwner ?? undefined,
            description: `${culprit.name} heard what ${ownerName} did`,
            funnyReason: `"${gossip.originDescription}" - and now ${culprit.name} has leverage`,
        };
    }

    return {
        type: 'cover_up',
        target: itemOwner ?? undefined,
        description: `${culprit.name} knows something about ${ownerName}`,
        funnyReason: `"${gossip.originDescription}" - time to distract everyone`,
    };
}

function createRivalryMotive(
    culprit: NPC,
    rivalId: NPCId,
    targetItem: Item,
    affinityValue: number,
    world: World
): Motive {
    const rival = world.npcs.find(n => n.id === rivalId);
    const rivalName = rival?.name ?? 'them';

    return {
        type: 'rivalry',
        target: rivalId,
        description: `${culprit.name} and ${rivalName} have... history`,
        funnyReason: `Affinity at ${affinityValue}. That's scientifically Low. Time for action.`,
    };
}

function createFrameMotive(
    culprit: NPC,
    frameTargetId: NPCId,
    targetItem: Item,
    world: World
): Motive {
    const frameTarget = world.npcs.find(n => n.id === frameTargetId);
    const targetName = frameTarget?.name ?? 'someone';

    return {
        type: 'revenge',
        target: frameTargetId,
        description: `${culprit.name} wants ${targetName} to take the blame`,
        funnyReason: `"If *I* can't have a good reputation, neither can ${targetName}"`,
    };
}

function createProtectiveMotive(
    culprit: NPC,
    friendId: NPCId,
    targetItem: Item,
    world: World
): Motive {
    const friend = world.npcs.find(n => n.id === friendId);
    const friendName = friend?.name ?? 'them';

    return {
        type: 'cover_up',
        target: friendId,
        description: `${culprit.name} is protecting ${friendName}`,
        funnyReason: `"${friendName} would have done the same for me" (they wouldn't)`,
    };
}

function createChaosMotive(
    culprit: NPC,
    targetItem: Item,
    rng: RNG
): Motive {
    const chaosReasons = [
        'Just wanted to see what would happen',
        'The vibes were off and someone had to do something',
        "Honestly? Couldn't tell you",
        'Mercury is in retrograde',
        'The item was looking at them funny',
        'Chaos is a ladder (they read that somewhere)',
    ];

    return {
        type: 'chaos',
        description: `${culprit.name} embraced chaos`,
        funnyReason: rng.pick(chaosReasons),
    };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Find which NPC is most associated with an item (simplified)
 * In reality, this would check who spends most time near the item
 */
function findItemAssociation(
    item: Item,
    world: World,
    rng: RNG
): NPCId | null {
    // For now: NPC whose schedule includes the item's room most often
    const itemPlace = item.startPlace;

    let bestNpc: NPC | null = null;
    let bestScore = 0;

    for (const npc of world.npcs) {
        const score = npc.schedule.filter(s => s.place === itemPlace).length;
        if (score > bestScore) {
            bestScore = score;
            bestNpc = npc;
        }
    }

    return bestNpc?.id ?? null;
}

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

    // Collect all possible motives and their weights
    const candidates: Array<{ motive: Motive; weight: number }> = [];

    // 1. Grudge-based revenge (reduced from 70% to base weight 25)
    const grudges = getGrudgesFrom(history, culprit.id);
    if (grudges.length > 0) {
        const grudge = grudges[0];
        candidates.push({
            motive: createGrudgeMotive(culprit, grudge, targetItem, history),
            weight: 25,
        });
    }

    // 2. Gossip-driven embarrassment/cover_up
    const heardGossip = getGossipKnownBy(gossipState, culprit.id);
    const gossipAboutOwner = heardGossip.filter(g => g.subjectNpc === itemOwner);
    if (gossipAboutOwner.length > 0) {
        candidates.push({
            motive: createGossipMotive(culprit, itemOwner, gossipAboutOwner[0], targetItem, world),
            weight: 20,
        });
    }

    // 3. Rivalry (low affinity enemy)
    const worstEnemy = getWorstEnemy(gossipState.affinities, culprit.id);
    if (worstEnemy && worstEnemy.value < 30) {
        candidates.push({
            motive: createRivalryMotive(culprit, worstEnemy.to, targetItem, worstEnemy.value, world),
            weight: 20,
        });
    }

    // 4. Protective cover_up (high affinity friend)
    const bestFriend = getBestFriend(gossipState.affinities, culprit.id);
    if (bestFriend && bestFriend.value > 70) {
        candidates.push({
            motive: createProtectiveMotive(culprit, bestFriend.to, targetItem, world),
            weight: 10,
        });
    }

    // 5. Envy (always available)
    candidates.push({
        motive: createEnvyMotive(culprit, itemOwner, targetItem, world, rng),
        weight: 15,
    });

    // 6. Attention (always available)
    candidates.push({
        motive: createAttentionMotive(culprit, targetItem, rng),
        weight: 10,
    });

    // 7. Chaos fallback (always available)
    candidates.push({
        motive: createChaosMotive(culprit, targetItem, rng),
        weight: 15,
    });

    // Weighted random selection
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    let roll = rng.nextInt(totalWeight);

    for (const candidate of candidates) {
        roll -= candidate.weight;
        if (roll < 0) {
            return candidate.motive;
        }
    }

    // Fallback (shouldn't reach here)
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

function createEnvyMotive(
    culprit: NPC,
    itemOwner: NPCId | null,
    targetItem: Item,
    world: World,
    rng: RNG
): Motive {
    const ownerName = world.npcs.find(n => n.id === itemOwner)?.name ?? 'someone';

    const envyReasons = [
        `It got more Instagram likes than ${culprit.name}'s selfie`,
        `Everyone keeps complimenting it instead of ${culprit.name}`,
        "It was featured in the family newsletter. They weren't.",
        `The neighbors noticed it and not ${culprit.name}'s new haircut`,
        `Even the therapist mentioned it`,
        `It's the main topic at every dinner party`,
    ];

    return {
        type: 'envy',
        target: itemOwner ?? undefined,
        description: `${culprit.name} can't stand that ${ownerName} has the ${targetItem.name}`,
        funnyReason: rng.pick(envyReasons),
    };
}

function createAttentionMotive(
    culprit: NPC,
    targetItem: Item,
    rng: RNG
): Motive {
    const attentionReasons = [
        'No one remembered their birthday. Again.',
        'The family group chat ignores their messages',
        'Even the smart home AI forgets their name',
        'Their Spotify Wrapped was mocked relentlessly',
        'No one watches their Instagram stories',
        'The dog greets everyone else first',
    ];

    return {
        type: 'attention',
        description: `${culprit.name} needs everyone to notice them for once`,
        funnyReason: rng.pick(attentionReasons),
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

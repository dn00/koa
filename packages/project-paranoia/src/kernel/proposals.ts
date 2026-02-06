import type { KernelState, Proposal, ProposalTag, SimEvent } from './types.js';

let proposalOrdinal = 0;

export function makeProposal(
    state: KernelState,
    event: Omit<SimEvent, 'id' | 'tick'>,
    tags: ProposalTag[]
): Proposal {
    const withTick = { tick: state.truth.tick, ...event };
    return {
        id: `${state.truth.tick}-p-${proposalOrdinal++}`,
        event: withTick,
        score: scoreForTags(tags),
        tags,
    };
}

export function scoreForTags(tags: ProposalTag[]): number {
    let score = 0;
    for (const tag of tags) {
        if (tag === 'pressure') score += 3;
        if (tag === 'uncertainty') score += 2;
        if (tag === 'choice') score += 2;
        if (tag === 'reaction') score += 2;
        if (tag === 'telegraph') score += 1;
        if (tag === 'consequence') score += 2;
    }
    return score;
}

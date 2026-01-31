/**
 * V5 Independence Computation
 * Signal root grouping and independence level calculation
 */

import type { SignalRoot, SignalRootGroup } from '../../types/v5/index.js';
import type { Card } from '../../types/v5/card.js';

/**
 * Maps each SignalRoot to its group.
 * Used to compute correlated_weak (same group, different root).
 */
export const signalRootGroup: Record<SignalRoot, SignalRootGroup> = {
  koa_cloud: 'cloud',
  phone_os: 'device',
  router_net: 'network',
  device_firmware: 'device',
  camera_storage: 'device',
  wearable_health: 'device',
  human_partner: 'human',
  human_neighbor: 'human',
  human_self: 'human',
  receipt_photo: 'physical',
  unknown: 'unknown',
} as const;

/**
 * Get the group for a signal root.
 * Prefer direct lookup over this function.
 */
export function getSignalRootGroup(root: SignalRoot): SignalRootGroup {
  return signalRootGroup[root];
}

/**
 * Independence level of played cards.
 * - 'diverse': No two cards share same signalRoot or signalRootGroup (best)
 * - 'correlated_weak': Two cards share same group but different roots
 * - 'correlated_strong': Two cards share exact same signalRoot (worst)
 */
export type IndependenceLevel = 'diverse' | 'correlated_weak' | 'correlated_strong';

/**
 * Computes the independence level of played cards based on their signalRoot values.
 *
 * Algorithm (from spec section 3.2):
 * 1. If any two played cards share same signalRoot (and signalRoot != 'unknown') => 'correlated_strong'
 * 2. Else if any two share same signalRootGroup (and group != 'unknown') => 'correlated_weak'
 * 3. Else => 'diverse'
 *
 * @param cards - Array of played cards (typically 1-3 cards)
 * @returns IndependenceLevel
 */
export function computeIndependence(cards: readonly Card[]): IndependenceLevel {
  // Check all pairs for same signalRoot (strong correlation)
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const cardA = cards[i];
      const cardB = cards[j];
      if (!cardA || !cardB) continue;

      const rootA = cardA.signalRoot;
      const rootB = cardB.signalRoot;

      // Skip if either card lacks signalRoot or has 'unknown'
      if (!rootA || !rootB || rootA === 'unknown' || rootB === 'unknown') continue;

      if (rootA === rootB) {
        return 'correlated_strong';
      }
    }
  }

  // Check all pairs for same group (weak correlation)
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const cardA = cards[i];
      const cardB = cards[j];
      if (!cardA || !cardB) continue;

      const rootA = cardA.signalRoot;
      const rootB = cardB.signalRoot;

      // Skip if either card lacks signalRoot
      if (!rootA || !rootB) continue;

      const groupA = signalRootGroup[rootA];
      const groupB = signalRootGroup[rootB];

      // Skip unknown groups
      if (groupA === 'unknown' || groupB === 'unknown') continue;

      if (groupA === groupB) {
        return 'correlated_weak';
      }
    }
  }

  return 'diverse';
}

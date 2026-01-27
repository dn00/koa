import { EvidenceCard, CounterEvidence, ContradictionResult, LocationValue, DamageResult, CorroborationResult } from './types';

export function checkContradiction(
  newCard: EvidenceCard,
  committedStory: EvidenceCard[]
): ContradictionResult | null {
  for (const committed of committedStory) {
    // Skip cards with no claims
    if ((!newCard.claims.location && !newCard.claims.state) || 
        (!committed.claims.location && !committed.claims.state)) continue;

    // Check location conflict
    if (newCard.claims.location && committed.claims.location) {
      if (newCard.claims.location !== committed.claims.location) {
        const loc1 = newCard.claims.location;
        const loc2 = committed.claims.location;

        const homeLocations: LocationValue[] = ['HOME', 'BEDROOM', 'KITCHEN', 'LIVING_ROOM'];
        const outsideLocations: LocationValue[] = ['GYM', 'WORK', 'COFFEE_SHOP'];

        const loc1IsHome = homeLocations.includes(loc1);
        const loc2IsHome = homeLocations.includes(loc2);

        if (loc1IsHome !== loc2IsHome) {
          return {
            severity: 'MAJOR',
            message: `You can't be at ${loc1} AND ${loc2} at the same time.`,
            cards: [newCard.id, committed.id]
          };
        }
      }
    }

    // Check state conflict
    if (newCard.claims.state && committed.claims.state) {
      const s1 = newCard.claims.state;
      const s2 = committed.claims.state;

      if ((s1 === 'ASLEEP' && s2 === 'AWAKE') || (s1 === 'AWAKE' && s2 === 'ASLEEP')) {
        return {
          severity: 'MINOR',
          message: `${committed.name} claims ${s2}, but ${newCard.name} claims ${s1}. That's suspicious.`,
          cards: [newCard.id, committed.id]
        };
      }
      
      if ((s1 === 'ACTIVE' && s2 === 'ASLEEP') || (s1 === 'ASLEEP' && s2 === 'ACTIVE')) {
         return {
          severity: 'MAJOR',
          message: `Impossible to be ${s1} and ${s2} simultaneously.`,
          cards: [newCard.id, committed.id]
        };
      }
    }
  }

  return null;
}

export function hasCorroboration(cards: EvidenceCard[]): CorroborationResult {
  if (cards.length < 2) return { has: false };

  const locations = cards.map(c => c.claims.location).filter(Boolean);
  const states = cards.map(c => c.claims.state).filter(Boolean);

  const locSet = new Set(locations);
  if (locations.length > 1 && locSet.size < locations.length) {
    return { has: true, type: 'LOCATION' };
  }

  const stateSet = new Set(states);
  if (states.length > 1 && stateSet.size < states.length) {
    return { has: true, type: 'STATE' };
  }

  return { has: false };
}

export function calculateDamage(
  cards: EvidenceCard[],
  activeCounter: CounterEvidence | null
): DamageResult {
  const breakdown: string[] = [];
  let total = 0;

  for (const card of cards) {
    let cardDamage = card.power;

    if (activeCounter && !activeCounter.refuted) {
      const isTargeted = card.proves.some(p => activeCounter.targets.includes(p));
      if (isTargeted) {
        cardDamage = Math.ceil(cardDamage * 0.5);
        breakdown.push(`${card.name}: ${card.power} → ${cardDamage} (contested)`);
      } else {
        breakdown.push(`${card.name}: ${cardDamage}`);
      }
    } else {
      breakdown.push(`${card.name}: ${cardDamage}`);
    }

    total += cardDamage;
  }

  const corr = hasCorroboration(cards);
  if (corr.has) {
    const bonus = Math.ceil(total * 0.25);
    total = total + bonus;
    breakdown.push(`Corroboration (${corr.type}): +${bonus}`);
  }

  return { total, breakdown };
}
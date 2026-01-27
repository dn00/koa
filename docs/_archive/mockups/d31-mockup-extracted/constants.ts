import { EvidenceCard, CounterEvidence, Concern } from './types';

export const SCENARIO = {
  id: '2026-01-26-FRIDGE',
  targetName: 'SMART FRIDGE v4',
  lockReason: "It's 2am. Midnight snacking violates Circadian Rhythm Policy.",
  auraOpening: "It's 2:14am. You're standing in front of your refrigerator. Again. Prove you're you. Prove you're awake. Prove you meant to do this.",
  resistance: 35,
  turns: 6,

  concerns: [
    { id: 'c1', auraAsks: "Prove you're you.", requiredProof: ['IDENTITY'], addressed: false },
    { id: 'c2', auraAsks: "Prove you're awake.", requiredProof: ['ALERTNESS'], stateRequirement: ['AWAKE', 'ALERT', 'ACTIVE'], addressed: false },
    { id: 'c3', auraAsks: "Prove you meant to do this.", requiredProof: ['INTENT'], addressed: false },
  ] as Concern[],

  counters: [
    {
      id: 'counter-camera',
      name: 'Security Camera',
      targets: ['IDENTITY'],
      claim: "No one detected at door 2:07am",
      refutableBy: ['maintenance-log'],
      refuted: false
    },
    {
      id: 'counter-sleep',
      name: 'Sleep Data Sync',
      targets: ['ALERTNESS'],
      claim: "User in REM sleep until 2:30am",
      refutableBy: ['noise-complaint'],
      refuted: false
    },
  ] as CounterEvidence[],

  // Dealt hand (same for all players today)
  hand: [
    {
      id: 'face-id',
      name: 'Face ID — Front Door',
      source: 'Apple HomeKit',
      power: 12,
      trust: 'VERIFIED',
      proves: ['IDENTITY'],
      claims: { timeRange: ['2:05am', '2:10am'], location: 'KITCHEN', state: 'AWAKE' },
      flavor: 'Biometric match: 99.7% confidence'
    },
    {
      id: 'smart-watch',
      name: 'Smart Watch',
      source: 'WristOS',
      power: 11,
      trust: 'VERIFIED',
      proves: ['ALERTNESS'],
      claims: { timeRange: ['2:00am', '2:15am'], state: 'AWAKE' },
      flavor: 'Heart rate 78bpm. 15 steps in last 5 minutes.'
    },
    {
      id: 'voice-log',
      name: 'Kitchen Voice Log',
      source: 'Echo Hub',
      power: 10,
      trust: 'VERIFIED',
      proves: ['INTENT'],
      claims: { timeRange: ['2:05am', '2:12am'], location: 'KITCHEN', state: 'AWAKE' },
      flavor: 'Voice command detected: "Open fridge"'
    },
    {
      id: 'maintenance-log',
      name: 'Maintenance Log',
      source: 'HomeSec',
      power: 5,
      trust: 'VERIFIED',
      proves: [],
      claims: { timeRange: ['2:00am', '2:30am'] },
      flavor: 'Camera offline 2:00-2:30am — firmware update',
      refutes: 'counter-camera'
    },
    {
      id: 'noise-complaint',
      name: 'Noise Complaint',
      source: 'BuildingMgmt',
      power: 6,
      trust: 'PLAUSIBLE',
      proves: [],
      claims: { timeRange: ['2:05am', '2:10am'] },
      flavor: 'Mrs. Henderson in 4B reported footsteps at 2:05am',
      refutes: 'counter-sleep'
    },
    {
      id: 'gym-wristband',
      name: 'Gym Wristband',
      source: 'FitClub',
      power: 14,
      trust: 'VERIFIED',
      proves: ['ALERTNESS'],
      claims: { timeRange: ['2:00am', '2:20am'], location: 'GYM', state: 'ACTIVE' },
      flavor: 'Workout session logged. Calories: 0.'
    },
  ] as EvidenceCard[],
};
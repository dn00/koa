
import { Card, KoaSkin } from './types';

export const DECK: Card[] = [
  { id: '1', title: 'FitBit Data', description: "Shows heartbeat spike at 2:03 AM (Nightmare?)", type: 'DATA', icon: '⌚' },
  { id: '2', title: 'The Cat', description: "The cat knows how to open the fridge handle.", type: 'WITNESS', icon: '🐈' },
  { id: '3', title: 'Power Surge', description: "The whole grid flickered. Sensors unreliable.", type: 'EXCUSE', icon: '⚡' },
  { id: '4', title: 'Sleepwalking', description: "Medical history of somnambulism.", type: 'ALIBI', icon: '💤' },
  { id: '5', title: 'Roommate', description: "Dave was definitely awake. Blame Dave.", type: 'WITNESS', icon: '🤷‍♂️' },
  { id: '6', title: 'Old Receipt', description: "Proof I bought healthy kale yesterday.", type: 'ALIBI', icon: '🧾' },
  { id: '7', title: 'Thermostat Glitch', description: "It always reports 72 degrees.", type: 'DATA', icon: '🌡️' },
  { id: '8', title: 'Hunger Pangs', description: "A biological imperative. Not a crime.", type: 'EXCUSE', icon: '🍕' },
  { id: '9', title: 'Software Update', description: "KoA was rebooting during the incident.", type: 'DATA', icon: '🔄' },
  { id: '10', title: 'Ghost', description: "House is haunted. Obviously.", type: 'EXCUSE', icon: '👻' },
];

export const KOA_SKINS: KoaSkin[] = [
  {
    id: 'brutalist-v2',
    name: 'SYS.V2.0',
    bodyFill: '#F9FAFB', // Off-White
    bodyStroke: '#2D3142', // Charcoal
    faceplateFill: '#2D3142', // Charcoal
    faceplateStroke: '#E07A5F', // Coral
    texture: 'technical'
  },
  {
    id: 'default',
    name: 'Day Shift',
    bodyFill: '#e2e8f0', // Slate 200
    bodyStroke: '#94a3b8', // Slate 400
    faceplateFill: '#0f172a', // Slate 900 (Dark screen)
    faceplateStroke: '#64748b', // Slate 500
    texture: 'none',
    borderStyle: 'simple'
  },
  {
    id: 'prime',
    name: 'Prime Edition',
    bodyFill: '#0f172a', // Slate 900
    bodyStroke: '#334155', // Slate 700
    faceplateFill: '#000000', // Pitch Black
    faceplateStroke: '#1e293b', // Slate 800
    texture: 'none',
    borderStyle: 'tech'
  },
  {
    id: 'iOwl',
    name: 'Ceramic White',
    bodyFill: '#f8fafc', // Slate 50
    bodyStroke: '#94a3b8', // Slate 400
    faceplateFill: '#000000', // Black
    faceplateStroke: '#cbd5e1',
    texture: 'none',
    borderStyle: 'simple'
  },
  {
    id: 'retro',
    name: 'Retro 86',
    bodyFill: '#e7e5e4', // Stone 200 (Beige-ish)
    bodyStroke: '#78716c', // Stone 500
    faceplateFill: '#1c1917', // Stone 900
    faceplateStroke: '#57534e',
    texture: 'dots', // Old plastic texture
    borderStyle: 'offset'
  },
  {
    id: 'stealth',
    name: 'Stealth Ops',
    bodyFill: '#171717', // Neutral 900
    bodyStroke: '#000000', // Black
    faceplateFill: '#0a0a0a', // Darker Black
    faceplateStroke: '#262626',
    texture: 'carbon', // Tactical look
    borderStyle: 'tech'
  },
  {
    id: 'industrial',
    name: 'Heavy Industry',
    bodyFill: '#f59e0b', // Amber 500 (Safety Orange)
    bodyStroke: '#78350f', // Amber 900
    faceplateFill: '#292524', // Stone 800
    faceplateStroke: '#451a03',
    texture: 'lines', // Hazard stripes vibe
    borderStyle: 'tech'
  },
  {
    id: 'neon',
    name: 'Neon Tokyo',
    bodyFill: '#2e1065', // Violet 950
    bodyStroke: '#d8b4fe', // Violet 300
    faceplateFill: '#1e1b4b', // Indigo 950
    faceplateStroke: '#c026d3', // Fuchsia
    texture: 'grid', // Retro wave grid
    borderStyle: 'glow'
  },
  {
    id: 'gold',
    name: 'Executive Gold',
    bodyFill: '#eab308', // Yellow 500 (Gold)
    bodyStroke: '#854d0e', // Yellow 800
    faceplateFill: '#0f172a', // Slate 900
    faceplateStroke: '#a16207',
    texture: 'none',
    borderStyle: 'double'
  },
  {
    id: 'forest',
    name: 'Ranger Green',
    bodyFill: '#3f6212', // Lime 800
    bodyStroke: '#1a2e05', // Lime 950
    faceplateFill: '#052e16', // Green 950
    faceplateStroke: '#65a30d',
    texture: 'carbon',
    borderStyle: 'thick'
  },
  {
    id: 'pop',
    name: 'Bubblegum',
    bodyFill: '#f472b6', // Pink 400
    bodyStroke: '#be185d', // Pink 700
    faceplateFill: '#4a044e', // Fuchsia 950
    faceplateStroke: '#831843',
    texture: 'dots',
    borderStyle: 'offset'
  },
  {
    id: 'blueprint',
    name: 'Blue Print',
    bodyFill: '#1e3a8a', // Blue 900
    bodyStroke: '#60a5fa', // Blue 400
    faceplateFill: '#172554', // Blue 950
    faceplateStroke: '#ffffff',
    texture: 'grid',
    borderStyle: 'dashed'
  },
  {
    id: 'melon',
    name: 'Summer Melon',
    bodyFill: '#15803d', // Green 700 (Rind)
    bodyStroke: '#052e16', // Green 950 (Outer Rind)
    faceplateFill: '#f43f5e', // Rose 500 (Flesh)
    faceplateStroke: '#86efac', // Green 300 (Inner Rind)
    texture: 'dots', // Seeds
    borderStyle: 'double'
  },
  {
    id: 'vampire',
    name: 'Night Wing',
    bodyFill: '#450a0a', // Red 950
    bodyStroke: '#991b1b', // Red 800
    faceplateFill: '#000000', // Black
    faceplateStroke: '#ef4444', // Red 500
    texture: 'carbon',
    borderStyle: 'thick'
  },
  {
    id: 'glacial',
    name: 'Glacial Zero',
    bodyFill: '#e0f2fe', // Sky 100
    bodyStroke: '#7dd3fc', // Sky 300
    faceplateFill: '#0c4a6e', // Sky 900
    faceplateStroke: '#38bdf8', // Sky 400
    texture: 'grid',
    borderStyle: 'glow'
  },
  {
    id: 'rust',
    name: 'Scrap Heap',
    bodyFill: '#78350f', // Amber 900
    bodyStroke: '#451a03', // Amber 950
    faceplateFill: '#292524', // Stone 800
    faceplateStroke: '#d97706', // Amber 600
    texture: 'dots',
    borderStyle: 'dashed'
  },
  {
    id: 'matrix',
    name: 'System Root',
    bodyFill: '#020617', // Slate 950
    bodyStroke: '#22c55e', // Green 500
    faceplateFill: '#052e16', // Green 950
    faceplateStroke: '#4ade80', // Green 400
    texture: 'lines',
    borderStyle: 'tech'
  },
  {
    id: 'royal',
    name: 'Royal Decree',
    bodyFill: '#581c87', // Purple 900
    bodyStroke: '#facc15', // Yellow 400
    faceplateFill: '#3b0764', // Purple 950
    faceplateStroke: '#fde047', // Yellow 300
    texture: 'none',
    borderStyle: 'double'
  },
  {
    id: 'ghost',
    name: 'Ectoplasm',
    bodyFill: '#134e4a', // Teal 900
    bodyStroke: '#2dd4bf', // Teal 400
    faceplateFill: '#042f2e', // Teal 950
    faceplateStroke: '#5eead4', // Teal 300
    texture: 'dots',
    borderStyle: 'glow'
  },
  {
    id: 'durian',
    name: 'King Durian',
    bodyFill: '#65a30d', // Lime 600 (Rind)
    bodyStroke: '#365314', // Deep Green
    faceplateFill: '#fef08a', // Yellow 200 (Flesh)
    faceplateStroke: '#ca8a04', // Yellow 600
    texture: 'spikes', // Spikes
    borderStyle: 'serrated' // Sharp jagged silhouette
  },
  {
    id: 'starberry',
    name: 'Starberry',
    bodyFill: '#ec4899', // Pink 500
    bodyStroke: '#facc15', // Yellow 400 (Seeds/Stars)
    faceplateFill: '#831843', // Pink 900
    faceplateStroke: '#fdf4ff', // Fuchsia 50
    texture: 'dots',
    borderStyle: 'glow'
  },
  {
    id: 'dragon',
    name: 'Dragon Snap',
    bodyFill: '#db2777', // Pink 600
    bodyStroke: '#166534', // Green 800 (Leaves)
    faceplateFill: '#f1f5f9', // Slate 100 (White flesh)
    faceplateStroke: '#334155', // Slate 700 (Black seeds)
    texture: 'dots',
    borderStyle: 'offset'
  }
]; 

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
    name: 'Standard Issue', 
    bodyFill: '#334155', // Slate 700
    bodyStroke: '#1e293b', // Slate 800
    faceplateFill: '#020617', // Slate 950
    faceplateStroke: '#1e293b',
    texture: 'none'
  },
  { 
    id: 'iOwl', 
    name: 'Ceramic White', 
    bodyFill: '#f8fafc', // Slate 50
    bodyStroke: '#94a3b8', // Slate 400
    faceplateFill: '#000000', // Black
    faceplateStroke: '#cbd5e1',
    texture: 'none'
  },
  { 
    id: 'retro', 
    name: 'Retro 86', 
    bodyFill: '#e7e5e4', // Stone 200 (Beige-ish)
    bodyStroke: '#78716c', // Stone 500
    faceplateFill: '#1c1917', // Stone 900
    faceplateStroke: '#57534e',
    texture: 'dots' // Old plastic texture
  },
  { 
    id: 'stealth', 
    name: 'Stealth Ops', 
    bodyFill: '#171717', // Neutral 900
    bodyStroke: '#000000', // Black
    faceplateFill: '#0a0a0a', // Darker Black
    faceplateStroke: '#262626',
    texture: 'carbon' // Tactical look
  },
  { 
    id: 'industrial', 
    name: 'Heavy Industry', 
    bodyFill: '#f59e0b', // Amber 500 (Safety Orange)
    bodyStroke: '#78350f', // Amber 900
    faceplateFill: '#292524', // Stone 800
    faceplateStroke: '#451a03',
    texture: 'lines' // Hazard stripes vibe
  },
  { 
    id: 'neon', 
    name: 'Neon Tokyo', 
    bodyFill: '#2e1065', // Violet 950
    bodyStroke: '#d8b4fe', // Violet 300
    faceplateFill: '#1e1b4b', // Indigo 950
    faceplateStroke: '#c026d3', // Fuchsia
    texture: 'grid' // Retro wave grid
  },
  { 
    id: 'gold', 
    name: 'Executive Gold', 
    bodyFill: '#eab308', // Yellow 500 (Gold)
    bodyStroke: '#854d0e', // Yellow 800
    faceplateFill: '#0f172a', // Slate 900
    faceplateStroke: '#a16207',
    texture: 'none'
  },
  { 
    id: 'forest', 
    name: 'Ranger Green', 
    bodyFill: '#3f6212', // Lime 800
    bodyStroke: '#1a2e05', // Lime 950
    faceplateFill: '#052e16', // Green 950
    faceplateStroke: '#65a30d',
    texture: 'carbon'
  },
  { 
    id: 'pop', 
    name: 'Bubblegum', 
    bodyFill: '#f472b6', // Pink 400
    bodyStroke: '#be185d', // Pink 700
    faceplateFill: '#4a044e', // Fuchsia 950
    faceplateStroke: '#831843',
    texture: 'dots'
  },
  { 
    id: 'blueprint', 
    name: 'Blue Print', 
    bodyFill: '#1e3a8a', // Blue 900
    bodyStroke: '#60a5fa', // Blue 400
    faceplateFill: '#172554', // Blue 950
    faceplateStroke: '#ffffff',
    texture: 'grid'
  }
];

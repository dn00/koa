export interface Room {
    id: string;
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: 'habitation' | 'operations' | 'extraction';
}

export interface Connection {
    from: string;
    to: string;
    id: string;
}

export const ROOMS: Room[] = [
    // --- OPERATIONS (Command Deck - Top) ---
    { id: 'bridge', name: 'BRIDGE', x: 40, y: 10, w: 20, h: 12, type: 'operations' },
    { id: 'core', name: 'CORE', x: 45, y: 28, w: 10, h: 10, type: 'operations' },

    // --- HABITATION (Left Wing) ---
    { id: 'dorms', name: 'DORMS', x: 10, y: 20, w: 20, h: 25, type: 'habitation' },
    { id: 'mess', name: 'MESS HALL', x: 10, y: 50, w: 20, h: 20, type: 'habitation' },
    { id: 'medbay', name: 'MEDBAY', x: 35, y: 50, w: 15, h: 15, type: 'habitation' },

    // --- ENGINEERING (Right Wing) ---
    { id: 'engineering', name: 'ENG', x: 65, y: 30, w: 20, h: 25, type: 'operations' },

    // --- EXTRACTION (The "Port" - Bottom) ---
    { id: 'cargo', name: 'CARGO BAY', x: 40, y: 70, w: 20, h: 20, type: 'extraction' },
    { id: 'airlock_a', name: 'A/L A', x: 65, y: 75, w: 8, h: 8, type: 'extraction' },
    { id: 'airlock_b', name: 'A/L B', x: 27, y: 75, w: 8, h: 8, type: 'extraction' },

    // --- EXTERIOR (Disconnected/Deep) ---
    // Mines are far below, connected by a long shaft
    { id: 'mines', name: 'MINES', x: 80, y: 80, w: 15, h: 15, type: 'extraction' },
];

export const CONNECTIONS: Connection[] = [
    // Habitation Loop
    { id: 'door_dorms_mess', from: 'dorms', to: 'mess' },
    { id: 'door_mess_medbay', from: 'mess', to: 'medbay' },

    // Central Spine
    { id: 'door_mess_bridge', from: 'mess', to: 'bridge' }, // Long corridor up
    { id: 'door_bridge_core', from: 'bridge', to: 'core' },
    { id: 'door_core_engineering', from: 'core', to: 'engineering' },

    // Cargo Access
    { id: 'door_engineering_cargo', from: 'engineering', to: 'cargo' },

    // Airlocks
    { id: 'door_cargo_airlock_a', from: 'cargo', to: 'airlock_a' },
    { id: 'door_cargo_airlock_b', from: 'cargo', to: 'airlock_b' },

    // The Long Walk (Exterior)
    { id: 'door_cargo_mines', from: 'cargo', to: 'mines' },
];

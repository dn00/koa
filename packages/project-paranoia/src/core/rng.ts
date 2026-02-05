export class RNG {
    private state: number;

    constructor(seed: number) {
        this.state = seed >>> 0;
    }

    next(): number {
        // LCG parameters from Numerical Recipes
        this.state = (1664525 * this.state + 1013904223) >>> 0;
        return this.state / 0xffffffff;
    }

    nextInt(max: number): number {
        return Math.floor(this.next() * max);
    }

    pick<T>(arr: T[]): T {
        return arr[this.nextInt(arr.length)];
    }
}

export function createRng(seed: number): RNG {
    return new RNG(seed);
}

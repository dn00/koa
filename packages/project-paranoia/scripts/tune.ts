import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type EnvOverrides = Record<string, string>;

interface TuneCase {
    name: string;
    env: EnvOverrides;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'src', 'index.ts');

const args = process.argv.slice(2);
const seeds = Number(getArg('--seeds', '6'));
const ticks = Number(getArg('--ticks', '200'));
const fastStart = args.includes('--fast-start');
const listOnly = args.includes('--list');
const maxCases = Number(getArg('--limit', '50'));

const candidates: TuneCase[] = buildGrid([
    {
        key: 'PARANOIA_MAX_ACTIVE_THREATS',
        values: ['1', '2'],
    },
    {
        key: 'PARANOIA_MELTDOWN_TICKS',
        values: ['8', '12'],
    },
    {
        key: 'PARANOIA_DAMAGE_BURN',
        values: ['8', '10', '12'],
    },
    {
        key: 'PARANOIA_SABOTAGE_CHANCE',
        values: ['1', '2', '3'],
    },
    {
        key: 'PARANOIA_QUOTA_PER_DAY',
        values: ['6', '8', '10'],
    },
]).slice(0, maxCases);

if (listOnly) {
    console.log(`Cases: ${candidates.length}`);
    for (const c of candidates) {
        console.log(`- ${c.name}`);
    }
    process.exit(0);
}

console.log(`Running ${candidates.length} cases x ${seeds} seeds @ ${ticks} ticks`);

const results: Array<{
    name: string;
    env: EnvOverrides;
    endings: Record<string, number>;
    avgCargo: number;
    avgAlive: number;
}> = [];

for (const candidate of candidates) {
    let totalCargo = 0;
    let totalAlive = 0;
    let parsedRuns = 0;
    const endings: Record<string, number> = {};

    for (let i = 0; i < seeds; i++) {
        const seed = 100 + i;
        const env: EnvOverrides = {
            ...candidate.env,
        };

        const out = spawnSync(
            'node',
            [
                '--import',
                'tsx',
                entry,
                `--autoplay=${ticks}`,
                `--seed=${seed}`,
                fastStart ? '--fast-start' : '',
            ].filter(Boolean),
            {
                cwd: root,
                env: { ...process.env, ...env },
                encoding: 'utf-8',
            }
        );

        if (out.status !== 0) {
            console.error(`Run failed for ${candidate.name} seed=${seed}`);
            if (out.stderr) console.error(out.stderr);
            continue;
        }

        const cleanStdout = stripAnsi(out.stdout ?? '');
        const summary = parseSummary(cleanStdout);
        if (!summary) {
            console.error(`No summary parsed for ${candidate.name} seed=${seed}`);
            const tail = cleanStdout.slice(-600);
            if (tail) console.error(tail);
            continue;
        }

        totalCargo += summary.totalCargo;
        totalAlive += summary.alive;
        endings[summary.ending] = (endings[summary.ending] ?? 0) + 1;
        parsedRuns += 1;
    }

    if (parsedRuns > 0) {
        results.push({
            name: candidate.name,
            env: candidate.env,
            endings,
            avgCargo: round(totalCargo / parsedRuns),
            avgAlive: round(totalAlive / parsedRuns),
        });
    }
}

results.sort((a, b) => b.avgCargo - a.avgCargo || b.avgAlive - a.avgAlive);

for (const r of results) {
    const endingSummary = Object.entries(r.endings)
        .map(([k, v]) => `${k}:${v}`)
        .join(' ');
    console.log(
        `${r.name} | cargo ${r.avgCargo} | alive ${r.avgAlive} | ${endingSummary}`
    );
}

function getArg(flag: string, fallback: string): string {
    const found = args.find(arg => arg.startsWith(`${flag}=`));
    if (!found) return fallback;
    return found.split('=')[1] ?? fallback;
}

function buildGrid(
    axes: Array<{ key: string; values: string[] }>
): TuneCase[] {
    const cases: TuneCase[] = [];

    function walk(index: number, current: EnvOverrides) {
        if (index >= axes.length) {
            cases.push({
                name: Object.entries(current)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(' | '),
                env: { ...current },
            });
            return;
        }

        const axis = axes[index];
        for (const value of axis.values) {
            current[axis.key] = value;
            walk(index + 1, current);
        }
    }

    walk(0, {});
    return cases;
}

function parseSummary(stdout: string): { totalCargo: number; alive: number; ending: string } | null {
    const cargoMatch = stdout.match(/TOTAL:\s+(\d+)/);
    const crewMatch = stdout.match(/CREW:\s+(\d+)\/(\d+)/);
    const endingMatch = stdout.match(/ENDING:\s+([A-Z_]+)/);

    if (!cargoMatch || !crewMatch || !endingMatch) return null;

    return {
        totalCargo: Number(cargoMatch[1]),
        alive: Number(crewMatch[1]),
        ending: endingMatch[1],
    };
}

function round(value: number): number {
    return Math.round(value * 10) / 10;
}

function stripAnsi(input: string): string {
    return input.replace(/\u001b\[[0-9;]*m/g, '');
}

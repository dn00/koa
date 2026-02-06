import { findValidDailySeed } from '../src/daily/finder.js';
const result = findValidDailySeed('2026-02-06', 2, []);
console.log(JSON.stringify(result, null, 2));

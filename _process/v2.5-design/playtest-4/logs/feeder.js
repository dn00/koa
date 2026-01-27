// Feeds lines to a child process stdin one at a time, waiting for prompts
import { spawn } from 'child_process';
const args = process.argv.slice(2);
const inputLines = args[0].split('|');
const child = spawn('npx', ['tsx', ...args.slice(1)], { stdio: ['pipe', 'inherit', 'inherit'] });
let lineIndex = 0;
let buffer = '';

// Wait a moment then feed lines when we see the prompt pattern
const interval = setInterval(() => {
  if (lineIndex < inputLines.length) {
    child.stdin.write(inputLines[lineIndex] + '\n');
    lineIndex++;
  } else {
    clearInterval(interval);
    child.stdin.end();
  }
}, 1500);

child.on('exit', () => { clearInterval(interval); process.exit(); });

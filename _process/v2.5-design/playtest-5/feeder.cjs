// Feeds lines to a child process one at a time, waiting for prompt
const { spawn } = require('child_process');
const args = process.argv.slice(2);
const inputLines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\n');

const child = spawn('npx', ['tsx', ...args], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';
let lineIndex = 0;

child.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);
  buffer += text;

  // Check if we see a prompt for input (ends with ": ")
  if (buffer.includes('comma-separated IDs): ') && lineIndex < inputLines.length) {
    const line = inputLines[lineIndex++];
    child.stdin.write(line + '\n');
    buffer = '';
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('close', (code) => {
  process.exit(code);
});

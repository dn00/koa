import { spawn } from 'child_process';
const inputs = process.argv.slice(3);
const logPath = process.argv[2];

const child = spawn('npx', ['tsx', 'scripts/play-v2.5.ts', '--log', logPath], {
  cwd: '/home/denk/Code/aura',
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
child.stdout.on('data', d => { output += d.toString(); process.stdout.write(d); });
child.stderr.on('data', d => process.stderr.write(d));

let inputIndex = 0;
let lastLength = 0;

const interval = setInterval(() => {
  if (output.length > lastLength && inputIndex < inputs.length) {
    const newOutput = output.slice(lastLength);
    if (newOutput.includes('comma-separated IDs):')) {
      lastLength = output.length;
      setTimeout(() => {
        child.stdin.write(inputs[inputIndex] + '\n');
        inputIndex++;
      }, 200);
    }
  }
}, 100);

child.on('close', () => { clearInterval(interval); });

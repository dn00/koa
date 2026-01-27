// Feeds lines to stdin of a child process with delays
import { spawn } from 'child_process';
const args = process.argv.slice(2);
const splitIdx = args.indexOf('--');
const inputs = args.slice(0, splitIdx);
const cmd = args.slice(splitIdx + 1);

const child = spawn(cmd[0], cmd.slice(1), { stdio: ['pipe', 'inherit', 'inherit'] });

let i = 0;
function feedNext() {
  if (i < inputs.length) {
    setTimeout(() => {
      child.stdin.write(inputs[i] + '\n');
      i++;
      feedNext();
    }, 2000);
  } else {
    setTimeout(() => child.stdin.end(), 2000);
  }
}
feedNext();
child.on('exit', (code) => process.exit(code));

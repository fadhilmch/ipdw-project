// One-command recordable demo: Firebase emulators + seed data + dev server.
// Usage: npm run demo    (then open http://localhost:5173)
import {spawn} from 'node:child_process';

const waitFor = async (url, timeoutMs = 90000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error(`Timed out waiting for ${url} - is Java 21+ installed? (Firebase emulators need it)`);
};

const emulators = spawn('npx', ['firebase', 'emulators:start', '--only', 'auth,firestore,storage'], {
  stdio: ['ignore', 'inherit', 'inherit']
});

let vite = null;
const cleanup = () => {
  emulators.kill('SIGINT');
  if (vite) vite.kill('SIGINT');
  process.exit(0);
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

console.log('Starting Firebase emulators (needs Java 21+)...');
await waitFor('http://localhost:9099');
await waitFor('http://localhost:8180');
console.log('Emulators up. Seeding demo data...');

const seed = spawn('node', ['scripts/seed-demo.mjs'], {stdio: 'inherit'});
await new Promise((res, rej) => {
  seed.on('exit', code => (code === 0 ? res() : rej(new Error(`seed exited ${code}`))));
});

console.log('');
console.log('Demo accounts (email already verified):');
console.log('  demo@bookio.dev / demo1234   (owns 3 books)');
console.log('  seller@bookio.dev / demo1234 (owns 3 books)');
console.log('Registering a new account also works: after signing up, open');
console.log('http://localhost:9099/emulator/v1/projects/demo-bookio-test/oobCodes');
console.log('and follow the verifyEmail oobLink to confirm the address.');
console.log('');

vite = spawn('npx', ['vite', '--mode', 'demo'], {stdio: 'inherit'});
vite.on('exit', cleanup);

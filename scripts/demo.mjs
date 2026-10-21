// One-command recordable demo: Firebase emulators + seed data + dev server.
// Usage: npm run demo    (then open http://localhost:5173)
import {spawn} from 'node:child_process';
import {existsSync, writeFileSync} from 'node:fs';

// Demo config: written on first run so no manual setup is needed. Points the
// app at the local emulators only - never a real Firebase project.
if (!existsSync('.env.demo')) {
  writeFileSync('.env.demo', `VITE_USE_EMULATORS=true
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-bookio-test.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://demo-bookio-test.firebaseio.com
VITE_FIREBASE_PROJECT_ID=demo-bookio-test
VITE_FIREBASE_STORAGE_BUCKET=demo-bookio-test.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:demo
VITE_CONFIRMATION_EMAIL_REDIRECT=http://localhost:5173
VITE_DEFAULT_PORTRAIT=https://picsum.photos/seed/bookio-portrait/200/200
# Optional: fill real keys in .env.local to use live Algolia/Maps instead.
VITE_ALGOLIA_APP_ID=
VITE_ALGOLIA_SEARCH_KEY=
VITE_GOOGLE_MAPS_API_KEY=
`);
  console.log('Wrote .env.demo (emulator-only demo config)');
}

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

const emulators = spawn('npx', ['firebase', 'emulators:start', '--project', 'demo-bookio-test', '--only', 'auth,firestore,storage'], {
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

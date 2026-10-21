// Seeds the local Firebase emulators with demo users and books so the app is
// immediately recordable. Idempotent: re-running refreshes the book data.
// Talks only to the emulator REST endpoints on localhost.
const AUTH = 'http://localhost:9099';
const FS = 'http://localhost:8180/v1/projects/demo-bookio-test/databases/(default)/documents';
const KEY = 'demo-api-key';

const post = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  return res.json();
};

const ensureUser = async (email, password, username) => {
  let r = await post(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${KEY}`, {
    email, password, displayName: username, returnSecureToken: true
  });
  if (r.error && r.error.message === 'EMAIL_EXISTS') {
    r = await post(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`, {
      email, password, returnSecureToken: true
    });
  }
  if (!r.localId) throw new Error(`auth failed for ${email}: ${JSON.stringify(r)}`);
  // verify the email through the emulator OOB flow
  await post(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${KEY}`, {
    requestType: 'VERIFY_EMAIL', idToken: r.idToken
  });
  const oobs = await (await fetch(`${AUTH}/emulator/v1/projects/demo-bookio-test/oobCodes`)).json();
  const oob = (oobs.oobCodes || []).filter(c => c.email === email && c.requestType === 'VERIFY_EMAIL').pop();
  if (oob) await fetch(`${AUTH}/emulator/action?mode=verifyEmail&lang=en&oobCode=${oob.oobCode}&apiKey=${KEY}`);
  return r.localId;
};

const str = v => ({stringValue: v});
const num = v => ({integerValue: String(v)});
const dbl = v => ({doubleValue: v});
const docPath = id => `${FS}/${id}`;

const writeDoc = async (path, fields) => {
  const res = await fetch(docPath(path), {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({fields})
  });
  if (!res.ok) throw new Error(`write ${path} failed: ${res.status} ${await res.text()}`);
};

const clearCollection = async name => {
  const r = await (await fetch(`${FS}/${name}?pageSize=500`)).json();
  for (const d of r.documents || []) {
    await fetch(`http://localhost:8180/v1/${d.name}`, {method: 'DELETE'});
  }
};

const seller = await ensureUser('seller@bookio.dev', 'demo1234', 'Demo Seller');
const reader = await ensureUser('demo@bookio.dev', 'demo1234', 'Demo Reader');
console.log('users:', {seller, reader});

await clearCollection('books');

const stockholm = {lat: 59.33, lon: 18.06};
const books = [
  {title: 'The Pragmatic Programmer', isbn: '9780135957059', author: 'David Thomas & Andrew Hunt', type: 'lend', owner: seller, ownerName: 'Demo Seller', seed: 'pragmatic', rating: 4.5, description: 'Classic software craftsmanship book. Good condition, a few dog-eared pages.'},
  {title: 'Clean Code', isbn: '9780132350884', author: 'Robert C. Martin', type: 'lend', owner: seller, ownerName: 'Demo Seller', seed: 'cleancode', rating: 4.2, description: 'A handbook of agile software craftsmanship. Like new.'},
  {title: 'The Hobbit', isbn: '9780547928227', author: 'J.R.R. Tolkien', type: 'give', owner: seller, ownerName: 'Demo Seller', seed: 'hobbit', rating: 4.8, description: 'Well-loved paperback, free to a good home.'},
  {title: 'Sapiens', isbn: '9780062316097', author: 'Yuval Noah Harari', type: 'lend', owner: reader, ownerName: 'Demo Reader', seed: 'sapiens', rating: 4.4, description: 'A brief history of humankind. Hardcover, great shape.'},
  {title: 'Norwegian Wood', isbn: '9780375704024', author: 'Haruki Murakami', type: 'give', owner: reader, ownerName: 'Demo Reader', seed: 'norwegian', rating: 4.1, description: 'Moving out, giving away my Murakami collection.'},
  {title: 'The Design of Everyday Things', isbn: '9780465050659', author: 'Don Norman', type: 'lend', owner: reader, ownerName: 'Demo Reader', seed: 'design', rating: 4.3, description: 'Revised edition. A must-read for anyone who makes things.'}
];

const ownedBy = {[seller]: [], [reader]: []};
for (const [i, b] of books.entries()) {
  const id = `demo-book-${i + 1}`;
  await writeDoc(`books/${id}`, {
    title: str(b.title),
    author: str(b.author),
    description: str(b.description),
    type: str(b.type),
    ownerId: str(b.owner),
    owner: str(b.ownerName),
    avatar: str(`https://picsum.photos/seed/${b.ownerName.replace(' ', '')}/200/200`),
    rating: {doubleValue: b.rating},
    imageUrls: {arrayValue: {values: [str(`https://covers.openlibrary.org/b/isbn/${b.isbn}-L.jpg`)]}},
    location: {mapValue: {fields: {lat: dbl(stockholm.lat + i * 0.005), lon: dbl(stockholm.lon + i * 0.004)}}},
    createdAt: num(Date.now() - (books.length - i) * 86400000),
    updatedAt: num(Date.now() - (books.length - i) * 86400000)
  });
  ownedBy[b.owner].push(id);
}

for (const [uid, username, email, myBooks] of [
  [seller, 'Demo Seller', 'seller@bookio.dev', ownedBy[seller]],
  [reader, 'Demo Reader', 'demo@bookio.dev', ownedBy[reader]]
]) {
  await writeDoc(`users/${uid}`, {
    username: str(username),
    email: str(email),
    location: str('Stockholm'),
    photoUrl: str(`https://picsum.photos/seed/${username.replace(' ', '')}/200/200`),
    age: {nullValue: null},
    phoneNumber: {nullValue: null},
    myBooks: {arrayValue: {values: myBooks.map(str)}},
    items: {arrayValue: {values: []}},
    transactions: {arrayValue: {values: []}}
  });
}
console.log(`seeded ${books.length} books`);


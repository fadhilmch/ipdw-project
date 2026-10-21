// Local (demo/firestore) counterpart of the Algolia filter string built by
// the shelf filter pills, e.g. 'type:"_____" OR type:"lend" OR type:"give"'.
// The string format is owned by BooksPage; these helpers parse it back into
// the set of book types it selects so the local listing narrows the same
// way the Algolia path does.

export const parseBookTypeFilter = filter => {
  const types = [];
  const re = /type:"(lend|give)"/g;
  let m;
  while ((m = re.exec(filter || '')) !== null) {
    if (!types.includes(m[1])) {
      types.push(m[1]);
    }
  }
  return types;
};

export const filterBooksByType = (books, filter) => {
  const types = parseBookTypeFilter(filter);
  if (types.length === 0) {
    return books;
  }
  return books.filter(b => types.includes(b.type));
};

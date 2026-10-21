import {describe, it, expect} from 'vitest';

import {parseBookTypeFilter, filterBooksByType} from '../pages/bookTypeFilter';

const books = [
  {id: '1', type: 'lend'},
  {id: '2', type: 'give'},
  {id: '3', type: 'lend'}
];

describe('parseBookTypeFilter', () => {
  it('parses quoted type clauses from the shelf filter string', () => {
    expect(
      parseBookTypeFilter('type:"_____" OR type:"lend" OR type:"give"')
    ).toEqual(['lend', 'give']);
  });

  it('returns only the selected type when one pill is off', () => {
    expect(parseBookTypeFilter('type:"_____" OR type:"give"')).toEqual([
      'give'
    ]);
  });

  it('returns an empty list for empty or missing filter', () => {
    expect(parseBookTypeFilter('')).toEqual([]);
    expect(parseBookTypeFilter(undefined)).toEqual([]);
  });
});

describe('filterBooksByType', () => {
  it('keeps every book when both types are selected', () => {
    expect(
      filterBooksByType(books, 'type:"_____" OR type:"lend" OR type:"give"')
    ).toHaveLength(3);
  });

  it('narrows to the selected type when one pill is off', () => {
    const result = filterBooksByType(books, 'type:"_____" OR type:"give"');
    expect(result.map(b => b.id)).toEqual(['2']);
  });

  it('keeps every book when the filter has no type clause', () => {
    expect(filterBooksByType(books, '')).toHaveLength(3);
  });
});

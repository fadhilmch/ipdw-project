import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';
import {connect} from 'react-redux';

import {hasLocation, withDistance} from '../helpers/locationHelper';
import {storeBooks} from '../redux/actions/storeBooks';
import {storeCoords} from '../redux/actions/storeCoords';
import {
  incrementPage,
  decrementPage,
  goToPage
} from '../redux/actions/storePage';
import {storeSearchQuery} from '../redux/actions/storeSearchQuery';

import * as ROUTES from '../constants/routes';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import Loader from '../components/Loader/Loader';
import SearchResults from '../components/Books/SearchResults';
import FilterGroup from '../components/Books/FilterGroup';
import {algoliaIndex, algoliaEnabled} from '../algolia';
import {useFirebase} from '../components/Firebase';
import {getDocs} from 'firebase/firestore';
import Pagination from '../components/Pagination/Pagination';

const BooksPage = props => {
  const initialCoords = {lat: 0, lng: 0};
  const [totalPages, setTotalPages] = useState(1);
  const firebase = useFirebase();
  const demoMode = import.meta.env.VITE_USE_EMULATORS === 'true';

  // Explicit demo mode only (`npm run demo`, VITE_USE_EMULATORS=true):
  // list books straight from the emulator Firestore. Production builds
  // without Algolia keys keep their previous behavior - this never
  // broadens reads against a production backend.
  const getBooksFromFirestore = filter => {
    getDocs(firebase.books())
      .then(snap => {
        let books = snap.docs.map(d => ({id: d.id, ...d.data()}));
        const typeMatch = /type:(lend|give)/.exec(filter || '');
        if (typeMatch) books = books.filter(b => b.type === typeMatch[1]);
        props.storeBooks(withDistance(books, props.coords));
        setTotalPages(1);
      })
      .catch(err => {
        console.error(err);
      });
  };

  const onFilter = filter => {
    props.storeSearchQuery(filter);
    if (demoMode && !algoliaEnabled) {
      getBooksFromFirestore(filter);
      return;
    }
    algoliaIndex
      .search('', {
        filters: filter,
        page: props.page
      })
      .then(res => {
        props.storeBooks(withDistance(res.hits, props.coords));
        setTotalPages(res.nbPages);
      })
      .catch(err => {
        console.error(err);
      });
  };

  const getBooks = () => {
    if (demoMode && !algoliaEnabled) {
      getBooksFromFirestore(props.query);
      return;
    }
    algoliaIndex
      .search('')
      .then(res => {
        props.storeBooks(withDistance(res.hits, props.coords));
        setTotalPages(res.nbPages);
      })
      .catch(err => {
        console.error(err);
      });
  };

  const noBooksFound = (
    <div className="no-books-found">
      <h2>Whooooops...!</h2>
      <p>
        You must have an extraordinary taste! Unfortunately no one has the book
        that you are looking for on offer at the moment.
      </p>
    </div>
  );

  if (
    (!props.books || props.books.length === 0) &&
    props.hasSearched === false &&
    hasLocation(props.coords)
  ) {
    getBooks();
  }

  const handleChoosePage = page => {
    props.goToPage(page);
  };

  useEffect(() => {
    onFilter(props.query);
  }, [props.page]);

  return (
    <React.Fragment>
      <div className="books-tool-bar">
        <FilterGroup
          onFilterUpdate={filters => {
            props.goToPage(0);
            const strMap = {
              'Books to Borrow': 'lend',
              'Books to Have': 'give'
            };
            if (filters.length > 0) {
              onFilter(
                filters.reduce(
                  (pre, cur) => pre + ' OR type:"' + strMap[cur] + '"',
                  'type:"_____"'
                )
              );
            } else {
              onFilter(
                `type:"${strMap['Books to Have']}" OR type:"${
                  strMap['Books to Borrow']
                }"`
              );
            }
          }}
          filters={['Books to Borrow', 'Books to Have']}
        />
        <Link className="btn btn-add-book" to={ROUTES.ADD_BOOK}>
          <FontAwesomeIcon className="phone" icon="plus" />
          <span className="desktop">Add Book</span>
        </Link>
      </div>
      {props.books && props.books.length > 0 && props.coords !== initialCoords ? (
        <React.Fragment>
          <SearchResults books={props.books} />
          <Pagination
            totalPages={totalPages}
            currentPage={props.page}
            handleChoose={handleChoosePage}
          />
        </React.Fragment>
      ) : typeof props.books === 'undefined' ? (
        <div>{noBooksFound}</div>
      ) : (
        <Loader />
      )}
    </React.Fragment>
  );
};

BooksPage.propTypes = {
  books: PropTypes.array,
  coords: PropTypes.object,
  storeBooks: PropTypes.func,
  storeCoords: PropTypes.func,
  hasSearched: PropTypes.bool
};

const mapStateToProps = state => ({
  books: state.booksState.books,
  coords: state.coordsState.coords,
  hasSearched: state.searchState.hasSearched,
  page: state.pageState,
  query: state.searchQueryState.query
});

const mapDispatchToProps = dispatch => ({
  storeBooks: books => dispatch(storeBooks(books)),
  storeCoords: coords => dispatch(storeCoords(coords)),
  storeSearchQuery: query => dispatch(storeSearchQuery(query)),
  incrementPage: page => dispatch(incrementPage(page)),
  decrementPage: page => dispatch(decrementPage(page)),
  goToPage: page => dispatch(goToPage(page))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BooksPage);

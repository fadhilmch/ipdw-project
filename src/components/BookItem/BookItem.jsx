import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';

import {deleteDoc} from 'firebase/firestore';

import {useFirebase} from '../Firebase';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import Numeral from 'numeral';

import UserLabel from '../Books/UserLabel';

import {algoliaIndex} from '../../algolia';

const BookItem = props => {
  const firebase = useFirebase();
  const [deleted, setDeleted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const initCoords = {
    lat: 0,
    lng: 0
  };

  const parseDistance = distance => {
    const dist =
      parseInt(distance) > 0
        ? Numeral(distance).format('0.0') + 'km'
        : parseInt(distance * 1000) + 'm';
    return dist;
  };

  const booksPageOnly = (
    <div className="book-item-inner-footer">
      <UserLabel userName={props.userName} avatarUrl={props.userAvatar} />
      <div className="book-item-distance-container">
        {JSON.stringify(props.coords) !== JSON.stringify(initCoords) && (
          <React.Fragment>
            <FontAwesomeIcon icon="map-marker-alt" aria-hidden="true" />
            <span className="book-item-distance">
              {parseDistance(props.distance)}
            </span>
          </React.Fragment>
        )}
      </div>
    </div>
  );

  const deleteBookItem = e => {
    e.preventDefault();

    deleteDoc(firebase.book(props.bookId)).then(() => {
      setDeleted(true);
      algoliaIndex.deleteObject(props.bookId).catch(err => console.error(err));
    });
  };

  const accountPageOnly = (
    <div className="delete-book">
      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Trigger asChild>
          <button
            className="delete-book-btn"
            aria-label={'Remove ' + props.bookTitle}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmOpen(true);
            }}>
            <FontAwesomeIcon icon="times" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title className="dialog-title">
              Remove this book?
            </Dialog.Title>
            <Dialog.Description className="dialog-copy">
              &quot;{props.bookTitle}&quot; will be removed from your books.
              This cannot be undone.
            </Dialog.Description>
            <div className="dialog-actions">
              <Dialog.Close asChild>
                <button className="dialog-btn dialog-cancel">Keep it</button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <button
                  className="dialog-btn dialog-confirm"
                  onClick={deleteBookItem}>
                  Remove
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );

  return (
    <Link
      to={'/detail/' + props.bookId}
      className={'book-item-container' + (deleted ? ' hide' : '')}>
      {props.accountPage && accountPageOnly}
      <div
        className='book-item-img-container'>
        <img
          className="book-item-img"
          src={props.bookImgSrc}
          alt={props.bookTitle}
        />
        <div
          className={
            'book-item-type' +
            (props.type === 'give' ? ' give-label' : ' lend-label')
          }>
          {{lend: 'To Borrow', give: 'To Have'}[props.type]}
        </div>
      </div>
      <div className="book-item-header">
        <h3 className="book-item-title">{props.bookTitle}</h3>
        <h3 className="book-item-author">{props.authorName}</h3>
      </div>
      <div className="book-item-inner">{!props.accountPage && booksPageOnly}</div>
    </Link>
  );
};

BookItem.propTypes = {
  authorName: PropTypes.string,
  bookTitle: PropTypes.string,
  bookDescription: PropTypes.string,
  bookImgSrc: PropTypes.string,
  distance: PropTypes.number,
  type: PropTypes.string,
  userAvatar: PropTypes.string,
  userName: PropTypes.string,
  rating: PropTypes.number
};

const mapStateToProps = state => ({
  coords: state.coordsState.coords
});

export default connect(mapStateToProps)(BookItem);
